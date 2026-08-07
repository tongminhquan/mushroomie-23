import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const videoRoot = path.resolve(scriptDirectory, '..');

export const REQUIRED_ASSET_PATHS = [
  'brand/logo.webp',
  'fonts/paytone-one-400.woff2',
  'fonts/montserrat-400.woff2',
  'fonts/montserrat-600.woff2',
  'fonts/montserrat-700.woff2',
  'fonts/montserrat-800.woff2',
  'products/bracelet-green.webp',
  'products/bracelet-pink.webp',
  'products/bracelet-blue.webp',
  'products/keychains-pastel.webp',
  'products/keychains-blue.webp',
  'products/necklace-flowers.webp',
  'screenshots/home-desktop.png',
  'screenshots/home-mobile.png',
  'screenshots/products-desktop.png',
  'screenshots/news-desktop.png',
  'screenshots/mini-game-desktop.png',
  'audio/music/brand-bed.wav',
  'audio/sfx/whoosh.wav',
  'audio/sfx/pop.wav',
  'audio/sfx/shimmer.wav',
  ...Array.from({length: 9}, (_, index) =>
    `audio/voice/scene-${String(index + 1).padStart(2, '0')}.mp3`,
  ),
];

export const validateAssetPath = (assetPath) => {
  if (
    /^(?:https?:|\/|public\/|uploads\/)/i.test(assetPath) ||
    /localhost|127\.0\.0\.1/i.test(assetPath)
  ) {
    return `Unsafe asset path: ${assetPath}`;
  }

  return null;
};

export const preflightAssets = async () => {
  const verified = [];

  for (const assetPath of REQUIRED_ASSET_PATHS) {
    const pathError = validateAssetPath(assetPath);
    if (pathError) {
      throw new Error(pathError);
    }

    const absolutePath = path.resolve(videoRoot, 'public', assetPath);
    const fileStats = await stat(absolutePath);
    if (!fileStats.isFile() || fileStats.size <= 1024) {
      throw new Error(`Missing or undersized asset: ${absolutePath}`);
    }

    verified.push({assetPath, bytes: fileStats.size});
  }

  verified.sort((a, b) => a.assetPath.localeCompare(b.assetPath));
  console.log(JSON.stringify({verified}, null, 2));
  return verified;
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.toLocaleLowerCase() === scriptPath.toLocaleLowerCase()) {
  await preflightAssets();
}
