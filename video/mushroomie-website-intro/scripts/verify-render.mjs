import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function validateMetadata(meta) {
  const errors = [];
  if (meta.duration < 58 || meta.duration > 62) errors.push('Duration must be between 58 and 62 seconds');
  if (meta.width !== 1920) errors.push('Width must be 1920');
  if (meta.height !== 1080) errors.push('Height must be 1080');
  if (Math.abs(meta.fps - 30) > 0.01) errors.push('FPS must be 30');
  if (meta.videoCodec !== 'h264') errors.push('Video codec must be h264');
  if (!meta.pixFmt || !meta.pixFmt.includes('yuv420p')) errors.push('Pixel format must contain yuv420p');
  if (meta.audioCodec !== 'aac') errors.push('Audio codec must be aac');
  if (meta.channels !== 2) errors.push('Channels must be 2');
  if (meta.fileSizeBytes <= 1000000) errors.push('File size must be > 1MB');
  return errors;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMain = process.argv[1] === __filename;

if (isMain) {
  const artifactsDir = path.resolve(__dirname, '../../../artifacts/mushroomie-brand-video');
  const mp4Path = path.join(artifactsDir, 'mushroomie-website-intro-60s-16x9.mp4');
  
  if (!fs.existsSync(mp4Path)) {
    console.error('File not found:', mp4Path);
    process.exit(1);
  }

  const output = execSync(`npx.cmd remotion ffprobe -v error -show_streams -show_format -of json "${mp4Path}"`, { encoding: 'utf8' });
  const data = JSON.parse(output);
  
  const videoStream = data.streams.find(s => s.codec_type === 'video');
  const audioStream = data.streams.find(s => s.codec_type === 'audio');
  
  let fps = 0;
  if (videoStream?.r_frame_rate) {
    const [num, den] = videoStream.r_frame_rate.split('/');
    fps = parseInt(num, 10) / parseInt(den, 10);
  }

  const meta = {
    duration: parseFloat(data.format.duration),
    width: videoStream?.width,
    height: videoStream?.height,
    fps,
    videoCodec: videoStream?.codec_name,
    pixFmt: videoStream?.pix_fmt,
    audioCodec: audioStream?.codec_name,
    channels: audioStream?.channels,
    fileSizeBytes: parseInt(data.format.size, 10),
  };

  const errors = validateMetadata(meta);
  
  const verificationData = { meta, errors, valid: errors.length === 0 };
  fs.writeFileSync(path.join(artifactsDir, 'verification.json'), JSON.stringify(verificationData, null, 2));

  if (errors.length > 0) {
    console.error('Validation failed:');
    errors.forEach(e => console.error('- ' + e));
    process.exit(1);
  } else {
    console.log('Validation passed!');
  }
}
