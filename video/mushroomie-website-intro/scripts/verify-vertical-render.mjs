import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyRender} from './verify-render.mjs';

export const verifyVerticalRender = () =>
  verifyRender({
    filename: 'mushroomie-website-intro-43s-9x16-tiktok-v1.mp4',
    reportFilename: 'verification-43s-9x16-tiktok.json',
    width: 1080,
    height: 1920,
  });

if (
  path.resolve(process.argv[1] ?? '').toLocaleLowerCase() ===
  fileURLToPath(import.meta.url).toLocaleLowerCase()
) {
  await verifyVerticalRender();
}
