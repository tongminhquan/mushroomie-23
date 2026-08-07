import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('vertical TikTok presentation contracts', () => {
  it('locks conservative TikTok safe areas', () => {
    const theme = source('../vertical/vertical-theme.ts');
    expect(theme).toContain('left: 72');
    expect(theme).toContain('right: 180');
    expect(theme).toContain('top: 150');
    expect(theme).toContain('bottom: 530');
    expect(theme).toContain('bottom: 310');
    expect(theme).toContain('maxWidth: 800');
    expect(theme).toContain('maxHeight: 180');
    expect(theme).toContain('fontSize: 46');
    expect(theme).toContain('lineHeight: 1.12');
  });

  it('uses vertical config for progress and captions', () => {
    const progress = source('../vertical/VerticalProgressLine.tsx');
    const captions = source('../vertical/VerticalCaptionTrack.tsx');
    expect(progress).toContain('VERTICAL_VIDEO_CONFIG.durationInFrames - 1');
    expect(captions).toContain('VERTICAL_VIDEO_CONFIG.fps');
    expect(captions).toContain('maxWidth: VERTICAL_THEME.caption.maxWidth');
    expect(captions).toContain('paddingRight: VERTICAL_THEME.safe.right');
    expect(captions).toContain('WebkitLineClamp: 3');
  });
});
