import {access, mkdir, mkdtemp, rm, stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const videoRoot = path.resolve(scriptDirectory, '..');

export const CAPTURE_MANIFEST = [
  {
    route: '/',
    width: 1440,
    height: 2500,
    destination: 'screenshots/home-desktop.png',
  },
  {
    route: '/',
    width: 390,
    height: 2000,
    destination: 'screenshots/home-mobile.png',
  },
  {
    route: '/san-pham',
    width: 1440,
    height: 2500,
    destination: 'screenshots/products-desktop.png',
  },
  {
    route: '/tin-tuc',
    width: 1440,
    height: 2500,
    destination: 'screenshots/news-desktop.png',
  },
  {
    route: '/mini-game',
    width: 1440,
    height: 2500,
    destination: 'screenshots/mini-game-desktop.png',
  },
];

const edgeCandidates = [
  process.env.EDGE_PATH,
  process.env['PROGRAMFILES(X86)']
    ? path.join(
        process.env['PROGRAMFILES(X86)'],
        'Microsoft',
        'Edge',
        'Application',
        'msedge.exe',
      )
    : undefined,
  process.env.PROGRAMFILES
    ? path.join(
        process.env.PROGRAMFILES,
        'Microsoft',
        'Edge',
        'Application',
        'msedge.exe',
      )
    : undefined,
].filter(Boolean);

const findEdge = async () => {
  for (const candidate of edgeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next explicit installation path.
    }
  }

  throw new Error(
    `Microsoft Edge not found. Checked: ${edgeCandidates.join(', ')}`,
  );
};

export const capturePublicPages = async () => {
  const origin = process.env.MUSHROOMIE_CAPTURE_ORIGIN ?? 'https://mushroomie.io.vn';
  const parsedOrigin = new URL(origin);
  if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
    throw new Error(`Unsupported capture origin: ${origin}`);
  }

  const edgePath = await findEdge();
  const profileDirectory = await mkdtemp(
    path.join(os.tmpdir(), 'mushroomie-video-edge-'),
  );

  try {
    for (const item of CAPTURE_MANIFEST) {
      const pageUrl = new URL(item.route, parsedOrigin).toString();
      const response = await fetch(pageUrl, {redirect: 'follow'});
      if (!response.ok) {
        throw new Error(`Capture health check failed (${response.status}): ${pageUrl}`);
      }

      const output = path.resolve(videoRoot, 'public', item.destination);
      await mkdir(path.dirname(output), {recursive: true});

      const result = spawnSync(
        edgePath,
        [
          '--headless=new',
          '--disable-gpu',
          '--hide-scrollbars',
          '--force-device-scale-factor=1',
          '--virtual-time-budget=5000',
          `--window-size=${item.width},${item.height}`,
          `--user-data-dir=${profileDirectory}`,
          `--screenshot=${output}`,
          pageUrl,
        ],
        {encoding: 'utf8', maxBuffer: 10 * 1024 * 1024},
      );

      if (result.status !== 0) {
        throw new Error(
          `Edge capture failed for ${pageUrl}: ${result.stderr || result.stdout}`,
        );
      }

      const outputStats = await stat(output);
      if (!outputStats.isFile() || outputStats.size <= 10 * 1024) {
        throw new Error(`Captured screenshot is unexpectedly small: ${output}`);
      }

      console.log(
        `Captured ${item.destination} (${item.width}x${item.height}, ${outputStats.size} bytes)`,
      );
    }
  } finally {
    const resolvedTemp = path.resolve(os.tmpdir());
    const resolvedProfile = path.resolve(profileDirectory);
    if (
      resolvedProfile.startsWith(`${resolvedTemp}${path.sep}`) &&
      path.basename(resolvedProfile).startsWith('mushroomie-video-edge-')
    ) {
      await rm(resolvedProfile, {recursive: true, force: true});
    }
  }
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.toLocaleLowerCase() === scriptPath.toLocaleLowerCase()) {
  await capturePublicPages();
}
