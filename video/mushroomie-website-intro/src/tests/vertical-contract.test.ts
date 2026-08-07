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

    expect(hook).toContain('Một món phụ kiện');
    expect(hook).toContain('Một câu chuyện riêng');
    expect(hook).toContain('durationInFrames={120}');
    expect(hook).toContain('width: 760');
    expect(hook).toContain("maxWidth: '100%'");
    expect(website).toContain('Không gian handmade của riêng bạn');
    expect(website).toContain('durationInFrames={144}');
    expect(website).toContain('height: 720');
    expect(website).toContain('maxWidth: 760');
    expect(website).toContain('lineHeight: 1.08');
    expect(products).toContain('Tìm món phụ kiện hợp gu');
    expect(products).toContain('durationInFrames={150}');
    expect(products).toContain('minHeight: 172');

    const productCards = Array.from(
      products.matchAll(/width:\s*(\d+),\s*height:\s*(\d+)/g),
      ([, width, height]) => ({width: Number(width), height: Number(height)}),
    );
    expect(productCards).toHaveLength(3);
    const titleLines = [1, 2, 2] as const;
    productCards.forEach(({width, height}, index) => {
      const imageHeight = width * 4 / 3;
      const labelBudget = 34 + titleLines[index] * 26 * 1.2 + 4 + 17 * 1.2;
      expect(height - imageHeight).toBeGreaterThanOrEqual(labelBudget);
    });
    const cardPositions = Array.from(
      products.matchAll(/top:\s*(\d+),\s*(left|right):\s*(\d+)/g),
      ([, top, side, horizontal]) => ({
        top: Number(top),
        side,
        horizontal: Number(horizontal),
      }),
    );
    expect(cardPositions).toHaveLength(3);
    const entranceOffset = 28;
    const shadowAllowance = 30;
    cardPositions.forEach(({top}, index) => {
      expect(top + productCards[index].height + entranceOffset + shadowAllowance).toBeLessThanOrEqual(1240);
    });
    const horizontalExtent = (index: number) => {
      const {side, horizontal} = cardPositions[index];
      const width = productCards[index].width;
      return side === 'left'
        ? {left: horizontal, right: horizontal + width}
        : {left: 828 - horizontal - width, right: 828 - horizontal};
    };
    const hero = horizontalExtent(0);
    const rectangles = cardPositions.map(({top}, index) => ({
      ...horizontalExtent(index),
      top,
      bottom: top + productCards[index].height,
    }));
    rectangles.slice(1).forEach((support) => {
      expect(support.left).toBeGreaterThanOrEqual(0);
      expect(support.right).toBeLessThanOrEqual(828);
      expect(support.right <= hero.left || support.left >= hero.right).toBe(true);
      expect(
        support.right <= rectangles[0].left ||
          support.left >= rectangles[0].right ||
          support.bottom <= rectangles[0].top ||
          support.top >= rectangles[0].bottom,
      ).toBe(true);
    });
    expect(products).toContain("margin: '0 auto'");
  });
});
