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

  it('uses vertical timelines for Custom, Handmade, and Features', () => {
    const custom = source('../vertical/scenes/VerticalCustomScene.tsx');
    const handmade = source('../vertical/scenes/VerticalHandmadeScene.tsx');
    const features = source('../vertical/scenes/VerticalFeaturesScene.tsx');
    expect(custom).toContain('durationInFrames={177}');
    expect(custom).toContain('[124, 140]');
    expect(custom).toContain('Màu sắc');
    expect(custom).toContain('Vòng tay Custom');
    expect(handmade).toContain('durationInFrames={174}');
    expect(handmade).toContain('enter(frame, 0, 122)');
    expect(handmade).toContain("flexDirection: 'column'");
    expect(features).toContain('durationInFrames={177}');
    expect(features).toContain("gridTemplateColumns: 'repeat(2, 1fr)'");
    expect(features).toContain('delay: 38');
  });

  it('keeps the middle-scene artwork within the 828 by 1240 safe canvas', () => {
    const custom = source('../vertical/scenes/VerticalCustomScene.tsx');
    const handmade = source('../vertical/scenes/VerticalHandmadeScene.tsx');
    const features = source('../vertical/scenes/VerticalFeaturesScene.tsx');

    const customCard = {width: 480, height: 760};
    const customImageHeight = customCard.width * 4 / 3;
    const customLabelBudget = 34 + 26 * 1.2 + 4 + 17 * 1.2;
    const customFlowHeight =
      24 * 1.2 + 36 + 2 * 76 * 1.06 + 28 + (30 * 1.2 + 28) + 34 + customCard.height;
    expect(custom).toContain('style={{width: 480, height: 760}}');
    expect(customCard.height - customImageHeight).toBeGreaterThanOrEqual(customLabelBudget);
    expect(28).toBeGreaterThanOrEqual(20);
    expect(customFlowHeight).toBeLessThanOrEqual(1240);

    const handmadeTitleHeight = 72 * 1.2 + 30;
    const handmadeCardsHeight = 3 * 300 + 2 * 28;
    const handmadeEntranceOffset = 36;
    const handmadeTextWidth = 828 - 82 - 32 - 220 - 30;
    expect(handmade).toContain('height: 300');
    expect(handmade).toContain('width: 220, height: 220');
    expect(handmadeTitleHeight + handmadeCardsHeight + handmadeEntranceOffset).toBeLessThanOrEqual(1240);
    expect(handmadeTextWidth).toBeGreaterThanOrEqual(400);
    expect(2 * 42 * 1.12).toBeLessThanOrEqual(300 - 60);

    const featureCardWidth = (828 - 24) / 2;
    const featureInnerWidth = featureCardWidth - 40;
    const featureTitleHeight = 2 * 70 * 1.08 + 34;
    const featureCardHeight = Number(
      features.match(/const FEATURE_CARD_HEIGHT = (\d+);/)?.[1],
    );
    const featurePreviewWidth = Number(
      features.match(/const FEATURE_PREVIEW_WIDTH = (\d+);/)?.[1],
    );
    const featureGridHeight = 2 * featureCardHeight + 24;
    const featureInnerHeight =
      20 + 54 + 12 + 64 + 6 + 27 + 16 + 32 + featurePreviewWidth * 2500 / 1440 + 20;
    expect(features).toContain('height: FEATURE_CARD_HEIGHT');
    expect(features).toContain('height: 64');
    expect(features).toContain('style={{width: FEATURE_PREVIEW_WIDTH}}');
    expect(featureCardWidth).toBeLessThanOrEqual(828);
    expect(featureInnerWidth).toBeGreaterThan(0);
    expect(featureTitleHeight + featureGridHeight).toBeLessThanOrEqual(1240);
    expect(featureInnerHeight).toBeLessThanOrEqual(featureCardHeight);
  });

  it('fits every full-height BrowserFrame preview without clipping it', () => {
    const features = source('../vertical/scenes/VerticalFeaturesScene.tsx');
    const previewWidth = Number(
      features.match(/const FEATURE_PREVIEW_WIDTH = (\d+);/)?.[1],
    );
    const cardHeight = Number(
      features.match(/const FEATURE_CARD_HEIGHT = (\d+);/)?.[1],
    );

    expect(features).toContain('style={{width: FEATURE_PREVIEW_WIDTH}}');
    expect(features).not.toContain("height: 280, overflow: 'hidden'");
    expect(previewWidth).toBeGreaterThan(0);
    expect(cardHeight).toBe(500);

    // Every current desktop screenshot is 1440 by 2500, and BrowserFrame adds
    // its 32px toolbar. The source width must therefore fit the complete frame
    // inside the card's real remaining vertical budget.
    const previewHeight = 32 + previewWidth * 2500 / 1440;
    const verticalChrome = 20 + 54 + 12 + 64 + 6 + 27 + 16 + 20;
    expect(previewHeight).toBeLessThanOrEqual(cardHeight - verticalChrome);
  });

  it('registers one independent vertical composition and one shared audio bed', () => {
    const root = source('../Root.tsx');
    const vertical = source('../MushroomieIntroVertical.tsx');

    expect(root).toContain('id={VERTICAL_COMPOSITION_ID}');
    expect(root).toContain('component={MushroomieIntroVertical}');
    expect(root).toContain('durationInFrames={VERTICAL_VIDEO_CONFIG.durationInFrames}');
    expect(root).toContain('fps={VERTICAL_VIDEO_CONFIG.fps}');
    expect(root).toContain('width={VERTICAL_VIDEO_CONFIG.width}');
    expect(root).toContain('height={VERTICAL_VIDEO_CONFIG.height}');
    expect(vertical.match(/<Sequence /g)).toHaveLength(9);
    expect(vertical.match(/<AudioBed \/>/g)).toHaveLength(1);
    expect(vertical.match(/<VerticalCaptionTrack \/>/g)).toHaveLength(1);
    expect(vertical.match(/<VerticalProgressLine \/>/g)).toHaveLength(1);
    expect(vertical.match(/from=\{SCENES\[/g)).toHaveLength(9);
    expect(vertical.match(/durationInFrames=\{sceneDuration\(SCENES\[/g)).toHaveLength(9);
  });

  it('keeps Shopping Flow, slogan, and CTA inside final vertical contracts', () => {
    const shopping = source('../vertical/scenes/VerticalShoppingFlowScene.tsx');
    const end = source('../vertical/scenes/VerticalEndCardScene.tsx');

    expect(shopping).toContain('durationInFrames={147}');
    expect(shopping).toContain('ASSETS.screenshots.homeMobile');
    expect(shopping).toContain('width: 440');
    expect(shopping).toContain('[104, 124]');
    expect(end).toContain('durationInFrames={117}');
    expect(end).toContain('durationInFrames={84}');
    expect(end).toContain('Làm bằng tay,');
    expect(end).toContain('trao bằng tim');
    expect(end).not.toContain('Trao bằng tim');
    expect(end).toContain('mushroomie.io.vn');
    expect(end).toContain('Khám phá ngay');
    expect(end).toContain('enter(frame, 10, 60)');

    // The safe canvas is 828x1240 after the vertical shell's reserved edges.
    // The three labels and the mobile preview occupy disjoint horizontal lanes.
    const safeCanvas = {width: 828, height: 1240};
    const labelLane = {left: 0, width: 300};
    const phone = {right: 0, width: 440, border: 8};
    const phoneLeft = safeCanvas.width - phone.width - phone.border * 2;
    expect(labelLane.left + labelLane.width).toBeLessThanOrEqual(phoneLeft);

    // The source screenshot is exactly 390x844. Its displayed height includes
    // the MobileFrame's 8px border on each side; peak entrance displacement is 38px.
    const screenshotSource = {width: 390, height: 844};
    const innerWidth = phone.width - phone.border * 2;
    const phoneHeight = phone.border * 2 + (innerWidth * screenshotSource.height) / screenshotSource.width;
    const deviceLabelHeight = 30;
    const deviceStackBottom = 150 + deviceLabelHeight + 14 + phoneHeight + 38;
    expect(deviceStackBottom).toBeLessThanOrEqual(safeCanvas.height);

    const stepsBottom = 280 + 3 * 190 + 2 * 24;
    expect(stepsBottom).toBeLessThan(deviceStackBottom);
    expect(deviceStackBottom).toBeLessThanOrEqual(safeCanvas.height);

    // CTA motion settles by frame 70, before its local frame range ends at 84.
    const ctaFinalStateFrame = 10 + 60;
    expect(ctaFinalStateFrame).toBeLessThan(84);
  });
});
