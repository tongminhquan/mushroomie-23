import {describe, expect, it} from 'vitest';
import {activeCaptionAt, splitEmphasis} from '../lib/captions';
import {sceneOpacity} from '../lib/motion';
import {seededUnit} from '../lib/seed';

describe('shared presentation helpers', () => {
  it('selects captions by global millisecond and clears after the video', () => {
    expect(activeCaptionAt(42000)?.text).toContain('mushroomie.io.vn');
    expect(activeCaptionAt(43000)).toBeNull();
  });

  it('preserves copy while marking approved emphasis', () => {
    const source = 'Mushroomie — làm bằng tay, trao bằng tim.';
    const fragments = splitEmphasis(source, ['trao bằng tim']);
    expect(fragments.map(({text}) => text).join('')).toBe(source);
    expect(fragments.some(({text, highlighted}) =>
      highlighted && text === 'trao bằng tim',
    )).toBe(true);
  });

  it('keeps each non-overlapping scene visible at its hand-off boundary', () => {
    expect(sceneOpacity(0, 180)).toBe(1);
    expect(sceneOpacity(30, 180)).toBe(1);
    expect(sceneOpacity(179, 180)).toBe(1);
  });

  it('returns a stable unit value for a seed', () => {
    expect(seededUnit(42)).toBe(seededUnit(42));
    expect(seededUnit(42)).not.toBe(seededUnit(43));
    expect(seededUnit(42)).toBeGreaterThanOrEqual(0);
    expect(seededUnit(42)).toBeLessThan(1);
  });
});
