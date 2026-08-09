import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {finalizeDelivery} from './finalize-render.mjs';

export const VERTICAL_MASTER_FILENAME =
  'mushroomie-website-intro-43s-9x16-tiktok-master.mp4';
export const VERTICAL_FINAL_FILENAME = 'mushroomie-website-intro-43s-9x16-tiktok-v1.mp4';
export const VERTICAL_CONTACT_SHEET_FILENAME = 'final-contact-sheet-43s-9x16-tiktok.jpg';

export const finalizeVerticalRender = () =>
  finalizeDelivery({
    masterFilename: VERTICAL_MASTER_FILENAME,
    finalFilename: VERTICAL_FINAL_FILENAME,
    contactSheetFilename: VERTICAL_CONTACT_SHEET_FILENAME,
    contactSheetFilter:
      'fps=1/10,scale=-1:480:flags=lanczos,tile=5x1:padding=8:margin=8:color=0x071014',
  });

if (
  path.resolve(process.argv[1] ?? '').toLocaleLowerCase() ===
  fileURLToPath(import.meta.url).toLocaleLowerCase()
) {
  await finalizeVerticalRender();
}
