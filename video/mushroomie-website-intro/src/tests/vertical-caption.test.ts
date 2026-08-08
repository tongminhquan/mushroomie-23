import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {CAPTIONS} from '../lib/captions';
import * as verticalTheme from '../vertical/vertical-theme';

const captionSource = readFileSync(
  new URL('../vertical/VerticalCaptionTrack.tsx', import.meta.url),
  'utf8',
);

describe('vertical caption typography', () => {
  it('fits every canonical caption without truncating its words', () => {
    const adaptiveFontSize = (
      verticalTheme as Record<string, unknown>
    ).verticalCaptionFontSize;

    expect(adaptiveFontSize).toBeTypeOf('function');
    if (typeof adaptiveFontSize !== 'function') return;

    const fontSizes = CAPTIONS.map(({text}) => adaptiveFontSize(text));
    expect(fontSizes).toEqual([46, 46, 38, 38, 38, 38, 38, 46, 46]);
    expect(Math.min(...(fontSizes as number[]))).toBeGreaterThanOrEqual(38);
    expect(captionSource).toContain(
      'fontSize: verticalCaptionFontSize(caption.text)',
    );
    expect(captionSource).not.toContain('WebkitLineClamp');
  });
});
