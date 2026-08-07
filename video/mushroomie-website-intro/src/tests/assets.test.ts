import {describe, expect, it} from 'vitest';
import {CAPTURE_MANIFEST} from '../../scripts/capture-public-pages.mjs';
import {COPY_MANIFEST} from '../../scripts/prepare-local-assets.mjs';
import {ASSETS} from '../lib/assets';

const flattenStrings = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(flattenStrings);
  }

  return [];
};

describe('visual asset pipeline', () => {
  it('uses render-safe local asset identifiers', () => {
    for (const asset of flattenStrings(ASSETS)) {
      expect(asset).not.toMatch(/^(?:https?:|\/|public\/|uploads\/)/i);
      expect(asset).not.toMatch(/localhost|127\.0\.0\.1/i);
    }
  });

  it('copies only the approved logo and six products', () => {
    expect(COPY_MANIFEST).toHaveLength(7);
    expect(COPY_MANIFEST.map(({destination}) => destination)).toEqual([
      'brand/logo.webp',
      'products/bracelet-green.webp',
      'products/bracelet-pink.webp',
      'products/bracelet-blue.webp',
      'products/keychains-pastel.webp',
      'products/keychains-blue.webp',
      'products/necklace-flowers.webp',
    ]);
  });

  it('captures only approved public website routes', () => {
    expect(new Set(CAPTURE_MANIFEST.map(({route}) => route))).toEqual(
      new Set(['/', '/san-pham', '/tin-tuc', '/mini-game']),
    );
    expect(
      CAPTURE_MANIFEST.filter(({route}) => route === '/').map(
        ({destination}) => destination,
      ),
    ).toEqual(['screenshots/home-desktop.png', 'screenshots/home-mobile.png']);
  });
});
