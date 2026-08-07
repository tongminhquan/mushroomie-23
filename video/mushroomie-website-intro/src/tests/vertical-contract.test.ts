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

  it('keeps Hook, Website, and Products inside vertical safe geometry', () => {
    const hook = source('../vertical/scenes/VerticalHookScene.tsx');
    const website = source('../vertical/scenes/VerticalWebsiteScene.tsx');
    const products = source('../vertical/scenes/VerticalProductsScene.tsx');

    expect(hook).toContain('Má»™t mÃ³n phá»¥ kiá»‡n');
    expect(hook).toContain('Má»™t cÃ¢u chuyá»‡n riÃªng');
    expect(hook).toContain('durationInFrames={120}');
    expect(website).toContain('KhÃ´ng gian handmade cá»§a riÃªng báº¡n');
    expect(website).toContain('durationInFrames={144}');
    expect(website).toContain('height: 720');
    expect(products).toContain('TÃ¬m mÃ³n phá»¥ kiá»‡n há»£p gu');
    expect(products).toContain('durationInFrames={150}');
    expect(products).toContain('width: 390');
    expect(products).toContain('width: 300');
  });
});
