import {access, mkdir, readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Representative in-scene moments expose the intended art direction instead of
// sampling the exact cut where a new scene is only beginning its entrance.
export const KEY_FRAMES = [90, 210, 354, 559, 720, 855, 1072, 1190, 1260, 1276];

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const videoRoot = path.resolve(scriptDirectory, '..');
const artifactDirectory = path.resolve(videoRoot, '..', '..', 'artifacts', 'mushroomie-brand-video');
const keyframesDirectory = path.join(artifactDirectory, 'keyframes');
const remotionCli = path.join(videoRoot, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');

const run = (command, args, label) => {
  const result = spawnSync(command, args, {
    cwd: videoRoot,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`${label} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${result.stderr || result.stdout}`);
  }
};

export const buildFullFfmpegInvocation = (args, fullFfmpegPath) => ({
  command: fullFfmpegPath,
  args,
});

const findFullFfmpeg = async () => {
  if (process.env.FFMPEG_PATH) {
    await access(process.env.FFMPEG_PATH);
    return process.env.FFMPEG_PATH;
  }

  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const wingetDirectory = path.join(
      process.env.LOCALAPPDATA,
      'Microsoft',
      'WinGet',
      'Packages',
      'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe',
    );
    try {
      const candidates = (await readdir(wingetDirectory, {withFileTypes: true}))
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('ffmpeg-'))
        .map((entry) => entry.name)
        .sort()
        .reverse();
      for (const release of candidates) {
        const candidate = path.join(wingetDirectory, release, 'bin', 'ffmpeg.exe');
        try {
          await access(candidate);
          return candidate;
        } catch {
          // Continue with the next discovered release.
        }
      }
    } catch {
      // Fall through to PATH discovery.
    }
  }

  const lookup = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['ffmpeg'], {
    encoding: 'utf8',
  });
  const candidate = lookup.stdout?.split(/\r?\n/).find(Boolean);
  if (lookup.status === 0 && candidate) {
    return candidate;
  }

  throw new Error('Full FFmpeg was not found. Set FFMPEG_PATH before running review:stills.');
};

const stillInvocation = (frame, outputPath) => ({
  command: process.execPath,
  args: [
    remotionCli,
    'still',
    'src/index.ts',
    'MushroomieWebsiteIntro',
    outputPath,
    `--frame=${frame}`,
    '--scale=0.5',
    '--overwrite',
  ],
});

export const buildDrawTextFilter = (inputIndex, frame, fontPath) => {
  const escapedFontPath = fontPath
    .replaceAll('\\', '/')
    .replace(':', '\\:');
  return `[${inputIndex}:v]drawtext=fontfile='${escapedFontPath}':text='Frame ${frame}':fontcolor=white:fontsize=32:box=1:boxcolor=black@0.55:x=12:y=12[v${inputIndex}]`;
};

const contactSheetArgs = (inputPaths, outputPath, fontPath) => {
  const inputs = inputPaths.flatMap((input) => ['-i', input]);
  const labels = inputPaths.map((_, index) => `[v${index}]`).join('');
  const labelsWithText = inputPaths
    .map((_, index) => buildDrawTextFilter(index, KEY_FRAMES[index], fontPath))
    .join(';');
  const layout = '0_0|w0_0|w0+w1_0|w0+w1+w2_0|w0+w1+w2+w3_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|w0+w1+w2+w3_h0';

  return [
    '-y',
    ...inputs,
    '-filter_complex',
    `${labelsWithText};${labels}xstack=inputs=10:layout=${layout}[out]`,
    '-map',
    '[out]',
    '-frames:v',
    '1',
    outputPath,
  ];
};

export const renderKeyframes = async () => {
  await mkdir(keyframesDirectory, {recursive: true});
  const paths = [];

  for (const frame of KEY_FRAMES) {
    const outputPath = path.join(
      keyframesDirectory,
      `frame-${String(frame).padStart(4, '0')}.png`,
    );
    const invocation = stillInvocation(frame, outputPath);
    console.log(`Rendering frame ${frame}...`);
    run(invocation.command, invocation.args, `Render still ${frame}`);
    paths.push(outputPath);
  }

  const fullFfmpeg = await findFullFfmpeg();
  const labelFont = process.env.MUSHROOMIE_LABEL_FONT ?? 'C:\\Windows\\Fonts\\arial.ttf';
  await access(labelFont);
  const contactSheet = path.join(artifactDirectory, 'keyframes-contact-sheet.jpg');
  const invocation = buildFullFfmpegInvocation(
    contactSheetArgs(paths, contactSheet, labelFont),
    fullFfmpeg,
  );
  console.log('Generating contact sheet...');
  run(invocation.command, invocation.args, 'Generate contact sheet');
  console.log(contactSheet);
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.toLocaleLowerCase() === scriptPath.toLocaleLowerCase()) {
  await renderKeyframes();
}
