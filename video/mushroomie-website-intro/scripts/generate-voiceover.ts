import {access, mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NARRATION} from '../src/content/narration';
import {SCENES, sceneDuration} from '../src/content/scenes';
import {VIDEO_CONFIG} from '../src/config';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const videoRoot = path.resolve(scriptDirectory, '..');
const remotionCli = path.resolve(
  videoRoot,
  'node_modules',
  '@remotion',
  'cli',
  'remotion-cli.js',
);

export const EDGE_VOICE = 'vi-VN-NamMinhNeural';

export const buildVoiceJobs = () =>
  NARRATION.map((record) => {
    const scene = SCENES.find(({id}) => id === record.scene);
    if (!scene) {
      throw new Error(`Missing scene for narration: ${record.scene}`);
    }

    return {
      ...record,
      output: path.resolve(videoRoot, 'public', record.audio),
      allowedSeconds:
        sceneDuration(scene) / VIDEO_CONFIG.fps - 0.35,
    };
  });

export const buildEdgeTtsArgs = (
  job: ReturnType<typeof buildVoiceJobs>[number],
) => [
  '--voice',
  EDGE_VOICE,
  `--rate=${job.rate}`,
  `--pitch=${job.pitch}`,
  `--volume=${job.volume}`,
  '--text',
  job.text,
  '--write-media',
  job.output,
];

const runCapture = (
  command: string,
  args: string[],
  label: string,
  options: {cwd?: string} = {},
) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? videoRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`${label} failed to start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr || result.stdout}`);
  }

  return result;
};

const run = (
  command: string,
  args: string[],
  label: string,
  options: {cwd?: string} = {},
) => runCapture(command, args, label, options).stdout;

export const buildFfprobeInvocation = (filePath: string) => ({
  command: process.execPath,
  args: [
    remotionCli,
    'ffprobe',
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'json',
    filePath,
  ],
});

export const buildSilenceDetectInvocation = (filePath: string) => ({
  command: process.execPath,
  args: [
    remotionCli,
    'ffmpeg',
    '-hide_banner',
    '-nostats',
    '-i',
    filePath,
    '-af',
    'silencedetect=noise=-40dB:d=0.15',
    '-f',
    'null',
    '-',
  ],
});

export const parseSpokenEndSeconds = (
  output: string,
  totalSeconds: number,
) => {
  const starts = Array.from(
    output.matchAll(/silence_start:\s*([0-9.]+)/g),
    (match) => Number(match[1]),
  );
  const ends = Array.from(
    output.matchAll(/silence_end:\s*([0-9.]+)/g),
    (match) => Number(match[1]),
  );
  const trailingStart = starts.at(-1);
  const trailingEnd = ends.at(-1);

  if (
    trailingStart === undefined ||
    trailingEnd === undefined ||
    Math.abs(trailingEnd - totalSeconds) > 0.1
  ) {
    return totalSeconds;
  }

  return trailingStart;
};

const probeDuration = (filePath: string) => {
  const invocation = buildFfprobeInvocation(filePath);
  const stdout = run(
    invocation.command,
    invocation.args,
    `FFprobe ${path.basename(filePath)}`,
  );
  const parsed = JSON.parse(stdout) as {format?: {duration?: string}};
  const duration = Number(parsed.format?.duration);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Invalid probed duration for ${filePath}: ${stdout}`);
  }

  return duration;
};

const probeSpokenEnd = (filePath: string, totalSeconds: number) => {
  const invocation = buildSilenceDetectInvocation(filePath);
  const result = runCapture(
    invocation.command,
    invocation.args,
    `Silence detect ${path.basename(filePath)}`,
  );
  return parseSpokenEndSeconds(
    `${result.stdout}\n${result.stderr}`,
    totalSeconds,
  );
};

export const generateVoiceover = async () => {
  const edgeTts = path.resolve(
    videoRoot,
    '.venv',
    'Scripts',
    process.platform === 'win32' ? 'edge-tts.exe' : 'edge-tts',
  );
  await access(edgeTts);

  for (const job of buildVoiceJobs()) {
    await mkdir(path.dirname(job.output), {recursive: true});
    run(
      edgeTts,
      buildEdgeTtsArgs(job),
      `Edge TTS ${job.scene}`,
    );

    const actualSeconds = probeDuration(job.output);
    const spokenEndSeconds = probeSpokenEnd(job.output, actualSeconds);
    if (spokenEndSeconds > job.allowedSeconds) {
      throw new Error(
        `${job.scene} spoken audio ends at ${spokenEndSeconds.toFixed(3)}s; ` +
          `allowed ${job.allowedSeconds.toFixed(3)}s at ${job.rate}`,
      );
    }

    console.log(
      `${job.scene}: speech ${spokenEndSeconds.toFixed(3)}s / ` +
        `${job.allowedSeconds.toFixed(3)}s; media ${actualSeconds.toFixed(3)}s ` +
        `at ${job.rate} -> ${job.output}`,
    );
  }
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.toLocaleLowerCase() === scriptPath.toLocaleLowerCase()) {
  await generateVoiceover();
}
