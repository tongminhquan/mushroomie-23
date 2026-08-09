import {access, mkdir, readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const videoRoot = path.resolve(scriptDirectory, '..');

export const AUDIO_OUTPUTS = {
  music: 'audio/music/brand-bed.wav',
  whoosh: 'audio/sfx/whoosh.wav',
  pop: 'audio/sfx/pop.wav',
  shimmer: 'audio/sfx/shimmer.wav',
};

const absoluteOutput = (relativePath) =>
  path.resolve(videoRoot, 'public', relativePath);

const pcmOutputArgs = (duration, output) => [
  '-t',
  String(duration),
  '-c:a',
  'pcm_s16le',
  '-ar',
  '48000',
  '-ac',
  '2',
  absoluteOutput(output),
];

const chordInputs = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [130.81, 164.81, 196],
  [196, 246.94, 293.66],
].flatMap((chord) =>
  chord.flatMap((frequency) => [
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${frequency}:sample_rate=48000:duration=15`,
  ]),
);

const musicFilter = [
  "[0:a][1:a][2:a]amix=inputs=3:normalize=0:weights='0.22 0.17 0.14'[c0]",
  "[3:a][4:a][5:a]amix=inputs=3:normalize=0:weights='0.22 0.17 0.14'[c1]",
  "[6:a][7:a][8:a]amix=inputs=3:normalize=0:weights='0.22 0.17 0.14'[c2]",
  "[9:a][10:a][11:a]amix=inputs=3:normalize=0:weights='0.22 0.17 0.14'[c3]",
  '[c0][c1][c2][c3]concat=n=4:v=0:a=1[pad]',
  "[12:a]volume='if(lt(mod(t,0.555556),0.11),0.18,0)'[pulse]",
  '[pad][pulse]amix=inputs=2:normalize=0,' +
    'lowpass=f=5000,' +
    'aecho=0.8:0.25:180|360:0.12|0.07,' +
    'afade=t=in:st=0:d=1.5,' +
    'afade=t=out:st=58.5:d=1.5,' +
    'volume=0.75[out]',
].join(';');

export const buildAudioJobs = () => [
  {
    key: 'music',
    output: AUDIO_OUTPUTS.music,
    args: [
      '-y',
      ...chordInputs,
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=55:sample_rate=48000:duration=60',
      '-filter_complex',
      musicFilter,
      '-map',
      '[out]',
      ...pcmOutputArgs(60, AUDIO_OUTPUTS.music),
    ],
  },
  {
    key: 'whoosh',
    output: AUDIO_OUTPUTS.whoosh,
    args: [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'anoisesrc=color=pink:duration=0.45:sample_rate=48000:amplitude=0.7',
      '-af',
      'highpass=f=450,' +
        'afade=t=in:st=0:d=0.225,' +
        'afade=t=out:st=0.225:d=0.225',
      ...pcmOutputArgs(0.45, AUDIO_OUTPUTS.whoosh),
    ],
  },
  {
    key: 'pop',
    output: AUDIO_OUTPUTS.pop,
    args: [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=620:sample_rate=48000:duration=0.16',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=920:sample_rate=48000:duration=0.16',
      '-filter_complex',
      '[0:a][1:a]amix=inputs=2:normalize=0,' +
        'volume=0.7,' +
        'afade=t=out:st=0:d=0.16:curve=exp[out]',
      '-map',
      '[out]',
      ...pcmOutputArgs(0.16, AUDIO_OUTPUTS.pop),
    ],
  },
  {
    key: 'shimmer',
    output: AUDIO_OUTPUTS.shimmer,
    args: [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=880:sample_rate=48000:duration=1.2',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=1320:sample_rate=48000:duration=1.2',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=1760:sample_rate=48000:duration=1.2',
      '-filter_complex',
      '[0:a][1:a][2:a]amix=inputs=3:normalize=0,' +
        'aecho=0.8:0.3:90|180:0.2|0.1,' +
        'afade=t=in:st=0:d=0.08,' +
        'afade=t=out:st=0.55:d=0.65,' +
        'volume=0.38[out]',
      '-map',
      '[out]',
      ...pcmOutputArgs(1.2, AUDIO_OUTPUTS.shimmer),
    ],
  },
];

export const buildFfmpegInvocation = (args, ffmpegPath) => ({
  command: ffmpegPath,
  args,
});

const findFullFfmpeg = async () => {
  const explicitPath = process.env.FFMPEG_PATH;
  if (explicitPath) {
    await access(explicitPath);
    return explicitPath;
  }

  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const wingetPackage = path.join(
      process.env.LOCALAPPDATA,
      'Microsoft',
      'WinGet',
      'Packages',
      'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe',
    );

    try {
      const releases = (await readdir(wingetPackage, {withFileTypes: true}))
        .filter(
          (entry) => entry.isDirectory() && entry.name.startsWith('ffmpeg-'),
        )
        .map((entry) => entry.name)
        .sort()
        .reverse();

      for (const release of releases) {
        const candidate = path.join(
          wingetPackage,
          release,
          'bin',
          'ffmpeg.exe',
        );
        try {
          await access(candidate);
          return candidate;
        } catch {
          // Continue to the next explicitly discovered Winget release.
        }
      }
    } catch {
      // Fall through to PATH discovery.
    }
  }

  const lookup = spawnSync(
    process.platform === 'win32' ? 'where.exe' : 'which',
    ['ffmpeg'],
    {encoding: 'utf8'},
  );
  const candidate = lookup.stdout?.split(/\r?\n/).find(Boolean);
  if (lookup.status === 0 && candidate) {
    return candidate;
  }

  throw new Error(
    'Full FFmpeg not found. Set FFMPEG_PATH or install the Gyan.FFmpeg Winget package.',
  );
};

export const generateAudio = async () => {
  const ffmpegPath = await findFullFfmpeg();

  for (const job of buildAudioJobs()) {
    const output = absoluteOutput(job.output);
    await mkdir(path.dirname(output), {recursive: true});
    const invocation = buildFfmpegInvocation(job.args, ffmpegPath);
    const result = spawnSync(invocation.command, invocation.args, {
      cwd: videoRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });

    if (result.error) {
      throw new Error(`${job.key} failed to start: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(
        `${job.key} synthesis failed: ${result.stderr || result.stdout}`,
      );
    }

    console.log(`Generated ${job.output}`);
  }
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.toLocaleLowerCase() === scriptPath.toLocaleLowerCase()) {
  await generateAudio();
}
