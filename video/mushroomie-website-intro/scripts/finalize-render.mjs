import {access, mkdir, readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const videoRoot = path.resolve(scriptDirectory, '..');
const artifactDirectory = path.resolve(
  videoRoot,
  '..',
  '..',
  'artifacts',
  'mushroomie-brand-video',
);
export const MASTER_FILENAME = 'mushroomie-website-intro-43s-master.mp4';
export const FINAL_FILENAME = 'mushroomie-website-intro-43s-16x9-v1.mp4';
export const FINAL_CONTACT_SHEET_FILENAME = 'final-contact-sheet-43s.jpg';

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

  throw new Error('Full FFmpeg was not found. Set FFMPEG_PATH before running render:final.');
};

export const buildFinalEncodeArgs = (inputPath, outputPath) => [
  '-y',
  '-i',
  inputPath,
  '-map',
  '0:v:0',
  '-map',
  '0:a:0?',
  '-c:v',
  'libx264',
  '-preset',
  'medium',
  '-crf',
  '18',
  '-vf',
  'scale=in_range=pc:out_range=tv,format=yuv420p',
  '-pix_fmt',
  'yuv420p',
  '-r',
  '30',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ac',
  '2',
  '-af',
  'loudnorm=I=-16:LRA=11:TP=-1.5',
  '-movflags',
  '+faststart',
  outputPath,
];

export const HORIZONTAL_CONTACT_SHEET_FILTER =
  'fps=1/10,scale=480:-1:flags=lanczos,tile=5x1:padding=8:margin=8:color=0x071014';

export const buildFinalContactSheetArgs = (
  inputPath,
  outputPath,
  filter = HORIZONTAL_CONTACT_SHEET_FILTER,
) => [
  '-y',
  '-i',
  inputPath,
  '-vf',
  filter,
  '-frames:v',
  '1',
  '-q:v',
  '2',
  outputPath,
];

export const finalizeDelivery = async ({
  masterFilename,
  finalFilename,
  contactSheetFilename,
  contactSheetFilter,
}) => {
  await mkdir(artifactDirectory, {recursive: true});
  const resolvedMaster = path.join(artifactDirectory, masterFilename);
  const resolvedFinal = path.join(artifactDirectory, finalFilename);
  const resolvedContactSheet = path.join(artifactDirectory, contactSheetFilename);
  await access(resolvedMaster);
  const ffmpeg = await findFullFfmpeg();

  console.log(`Encoding ${finalFilename}...`);
  run(ffmpeg, buildFinalEncodeArgs(resolvedMaster, resolvedFinal), `Encode ${finalFilename}`);
  console.log(`Creating ${contactSheetFilename}...`);
  run(
    ffmpeg,
    buildFinalContactSheetArgs(
      resolvedFinal,
      resolvedContactSheet,
      contactSheetFilter,
    ),
    `Create ${contactSheetFilename}`,
  );
  console.log(resolvedFinal);
  console.log(resolvedContactSheet);
  return {finalPath: resolvedFinal, contactSheetPath: resolvedContactSheet};
};

export const finalizeRender = () =>
  finalizeDelivery({
    masterFilename: MASTER_FILENAME,
    finalFilename: FINAL_FILENAME,
    contactSheetFilename: FINAL_CONTACT_SHEET_FILENAME,
    contactSheetFilter: HORIZONTAL_CONTACT_SHEET_FILTER,
  });

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.toLocaleLowerCase() === scriptPath.toLocaleLowerCase()) {
  await finalizeRender();
}
