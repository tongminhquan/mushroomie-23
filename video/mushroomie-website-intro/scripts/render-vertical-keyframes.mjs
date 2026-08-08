import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderKeyframeSet} from './render-keyframes.mjs';

export const VERTICAL_COMPOSITION_ID = 'MushroomieWebsiteIntroVertical';
export const VERTICAL_KEYFRAMES_DIRECTORY = 'vertical-keyframes';
export const VERTICAL_CONTACT_SHEET_FILENAME = 'vertical-keyframes-contact-sheet.jpg';

export const renderVerticalKeyframes = () =>
  renderKeyframeSet({
    compositionId: VERTICAL_COMPOSITION_ID,
    directoryName: VERTICAL_KEYFRAMES_DIRECTORY,
    contactSheetFilename: VERTICAL_CONTACT_SHEET_FILENAME,
    scale: 0.35,
  });

if (
  path.resolve(process.argv[1] ?? '').toLocaleLowerCase() ===
  fileURLToPath(import.meta.url).toLocaleLowerCase()
) {
  await renderVerticalKeyframes();
}
