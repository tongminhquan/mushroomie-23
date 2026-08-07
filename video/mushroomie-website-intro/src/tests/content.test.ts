import {describe, expect, it} from 'vitest';
import captions from '../content/captions.json';
import {NARRATION} from '../content/narration';
import {SCENES} from '../content/scenes';
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

describe('approved content contract', () => {
  it('covers every frame exactly once', () => {
    expect(SCENES[0].from).toBe(0);

    for (let index = 1; index < SCENES.length; index++) {
      expect(SCENES[index].from).toBe(SCENES[index - 1].to + 1);
    }

    expect(SCENES.at(-1)?.to).toBe(1799);
  });

  it('aligns narration and captions to the nine scene windows', () => {
    const sceneIds = SCENES.map(({id}) => id);
    expect(NARRATION.map(({scene}) => scene)).toEqual(sceneIds);
    expect(captions).toHaveLength(9);
    expect(captions.map(({startMs, endMs}) => [startMs, endMs])).toEqual([
      [0, 5000],
      [5000, 11000],
      [11000, 18000],
      [18000, 27000],
      [27000, 36000],
      [36000, 44000],
      [44000, 52000],
      [52000, 57000],
      [57000, 60000],
    ]);
  });

  it('locks the approved slogan and CTA domain', () => {
    expect(NARRATION[7].text.toLocaleLowerCase('vi')).toContain(
      'làm bằng tay, trao bằng tim',
    );
    expect(NARRATION[8].text).toContain('mát-shrù-mi chấm ai ô chấm vi en');
  });

  it('keeps every render asset local and relative', () => {
    for (const asset of flattenStrings(ASSETS)) {
      expect(asset).not.toMatch(/^https?:/i);
      expect(asset).not.toMatch(/^\//);
      expect(asset).not.toMatch(/(?:^|\/)public\/uploads(?:\/|$)/i);
      expect(asset).not.toMatch(/localhost|127\.0\.0\.1/i);
    }
  });
});
