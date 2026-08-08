import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function validateMetadata(meta, expected = {width: 1920, height: 1080}) {
  const errors = [];
  if (meta.duration < 42.8 || meta.duration > 43.2) {
    errors.push('Duration must be between 42.8 and 43.2 seconds');
  }
  if (meta.width !== expected.width) errors.push(`Width must be ${expected.width}`);
  if (meta.height !== expected.height) errors.push(`Height must be ${expected.height}`);
  if (Math.abs(meta.fps - 30) > 0.01) errors.push('FPS must be 30');
  if (meta.videoCodec !== 'h264') errors.push('Video codec must be h264');
  if (!meta.pixFmt || !meta.pixFmt.includes('yuv420p')) {
    errors.push('Pixel format must contain yuv420p');
  }
  if (meta.audioCodec !== 'aac') errors.push('Audio codec must be aac');
  if (meta.channels !== 2) errors.push('Channels must be 2');
  if (meta.fileSizeBytes <= 1000000) errors.push('File size must be > 1MB');
  return errors;
}

export const verifyRender = ({filename, reportFilename, width, height}) => {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const videoRoot = path.resolve(scriptDirectory, '..');
  const artifactsDir = path.resolve(
    videoRoot,
    '../../artifacts/mushroomie-brand-video',
  );
  const remotionCli = path.join(
    videoRoot,
    'node_modules',
    '@remotion',
    'cli',
    'remotion-cli.js',
  );
  const mp4Path = path.join(artifactsDir, filename);
  if (!fs.existsSync(mp4Path)) {
    throw new Error(`File not found: ${mp4Path}`);
  }

  const output = execFileSync(
    process.execPath,
    [
      remotionCli,
      'ffprobe',
      '-v',
      'error',
      '-show_streams',
      '-show_format',
      '-of',
      'json',
      mp4Path,
    ],
    {cwd: videoRoot, encoding: 'utf8'},
  );
  const data = JSON.parse(output);
  const videoStream = data.streams.find((stream) => stream.codec_type === 'video');
  const audioStream = data.streams.find((stream) => stream.codec_type === 'audio');
  const [numerator, denominator] = (videoStream?.r_frame_rate ?? '0/1')
    .split('/')
    .map(Number);
  const meta = {
    duration: Number(data.format.duration),
    width: videoStream?.width,
    height: videoStream?.height,
    fps: numerator / denominator,
    videoCodec: videoStream?.codec_name,
    pixFmt: videoStream?.pix_fmt,
    audioCodec: audioStream?.codec_name,
    channels: audioStream?.channels,
    fileSizeBytes: Number(data.format.size),
  };
  const errors = validateMetadata(meta, {width, height});
  const verificationData = {meta, errors, valid: errors.length === 0};
  fs.writeFileSync(
    path.join(artifactsDir, reportFilename),
    JSON.stringify(verificationData, null, 2),
  );
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }
  return verificationData;
};

const isMain =
  path.resolve(process.argv[1] ?? '').toLocaleLowerCase() ===
  fileURLToPath(import.meta.url).toLocaleLowerCase();

if (isMain) {
  const result = verifyRender({
    filename: 'mushroomie-website-intro-43s-16x9-v1.mp4',
    reportFilename: 'verification-43s.json',
    width: 1920,
    height: 1080,
  });
  console.log(result.valid ? 'Validation passed!' : 'Validation failed!');
}
