import {copyFile, mkdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const videoRoot = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(videoRoot, '..', '..');

export const COPY_MANIFEST = [
  {source: 'public/logo.webp', destination: 'brand/logo.webp'},
  {
    source: 'public/uploads/19fee695-b91d-4de0-8a3b-3f443e60541f.webp',
    destination: 'products/bracelet-green.webp',
  },
  {
    source: 'public/uploads/2b0c9abe-3e1a-4329-a34b-76af47050de2.webp',
    destination: 'products/bracelet-pink.webp',
  },
  {
    source: 'public/uploads/92213f15-af99-4648-a20e-4e2c69e26f33.webp',
    destination: 'products/bracelet-blue.webp',
  },
  {
    source: 'public/uploads/4f66f767-3726-4be6-b48f-6001ecef1861.webp',
    destination: 'products/keychains-pastel.webp',
  },
  {
    source: 'public/uploads/a0b3e750-1035-4148-82d0-277445fca00c.webp',
    destination: 'products/keychains-blue.webp',
  },
  {
    source: 'public/uploads/d6984728-d738-4ff7-8a98-8a3f50b1446d.webp',
    destination: 'products/necklace-flowers.webp',
  },
];

export const prepareLocalAssets = async () => {
  for (const item of COPY_MANIFEST) {
    const source = path.resolve(repositoryRoot, item.source);
    const destination = path.resolve(videoRoot, 'public', item.destination);
    const sourceStats = await stat(source);

    if (!sourceStats.isFile() || sourceStats.size <= 1024) {
      throw new Error(`Invalid source asset: ${source}`);
    }

    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(source, destination);
    console.log(`Copied ${item.destination} (${sourceStats.size} bytes)`);
  }
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath.toLocaleLowerCase() === scriptPath.toLocaleLowerCase()) {
  await prepareLocalAssets();
}
