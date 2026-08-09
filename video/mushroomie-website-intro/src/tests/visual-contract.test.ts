import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('visual presentation contracts', () => {
  it('drives progress from the shared composition config', () => {
    const progress = source('../components/ProgressLine.tsx');

    expect(progress).toContain("import { VIDEO_CONFIG } from '../config';");
    expect(progress).not.toContain('durationInFrames: 1800');
  });

  it('uses transform-only motion for the ambient beads, progress line, and handmade path', () => {
    const ambient = source('../components/AmbientBackground.tsx');
    const progress = source('../components/ProgressLine.tsx');
    const handmade = source('../scenes/HandmadeScene.tsx');

    expect(ambient).toContain('transform: `translate3d(0, ${b.offsetY}px, 0)`');
    expect(ambient).not.toContain('top: `calc(${b.y}% + ${b.offsetY}px)`');
    expect(progress).toContain("width: '100%'");
    expect(progress).toContain('transform: `scaleX(${progress})`');
    expect(handmade).toContain('transform: `scaleX(${pathProgress})`');
    expect(handmade).not.toContain('width: `${pathProgress * 100}%`');
  });

  it('keeps product-card sizing coherent and reserves a clear title corridor', () => {
    const products = source('../scenes/ProductsScene.tsx');
    const custom = source('../scenes/CustomScene.tsx');
    const card = source('../components/ProductCard.tsx');

    expect(products).not.toContain('style={{width: 400}}');
    expect(products).not.toContain("translateY(-54px)");
    expect(products).toContain('paddingTop: 12');
    expect(products).toContain('marginTop: 18');
    expect(products).toContain('[-24, 0]');
    expect(custom).not.toContain('style={{width: 480}}');
    expect(custom).not.toContain('transition:');
    expect(custom).toContain('top: 28');
    expect(custom).toContain('zIndex: 2');
    expect(card).toContain("aspectRatio: '3 / 4'");
    expect(card).toContain('height: 560');
  });

  it('reserves the lower-third corridor and bounds narration to its scene', () => {
    const features = source('../scenes/FeaturesScene.tsx');
    const shopping = source('../scenes/ShoppingFlowScene.tsx');
    const audio = source('../components/AudioBed.tsx');
    const captions = source('../components/CaptionTrack.tsx');

    expect(features).toContain('paddingBottom: 180');
    expect(features).toContain('height: 248');
    expect(shopping).toContain('top: 24');
    expect(shopping).toContain('style={{width: 300}}');
    expect(shopping).not.toContain('height: 500');
    expect(shopping).not.toContain('bottom: THEME.safe.y');
    expect(audio).toContain('durationInFrames={sceneDuration(scene)}');
    expect(captions).toContain('fontSize: 38');
    expect(captions).toContain('maxHeight: THEME.caption.maxHeight');
    expect(captions).toContain('paddingBottom: THEME.caption.bottom');
  });

  it('keeps the website mockup above the caption corridor', () => {
    const theme = source('../content/theme.ts');
    const website = source('../scenes/WebsiteScene.tsx');
    const captions = source('../components/CaptionTrack.tsx');

    expect(theme).toContain(
      'caption: {bottom: 108, maxHeight: 128, clearance: 28}',
    );
    expect(captions).toContain('paddingBottom: THEME.caption.bottom');
    expect(captions).toContain('maxHeight: THEME.caption.maxHeight');
    expect(website).toContain('height: 650');
    expect(website).toContain("overflow: 'hidden'");
    expect(website).toContain('THEME.caption.clearance');
  });

  it('settles the domain and CTA during the short final scene', () => {
    const endCard = source('../scenes/EndCardScene.tsx');

    expect(endCard).toContain('const domainOpacity = enter(frame, 10, 16);');
    expect(endCard).toContain('const btnOpacity = enter(frame, 20, 16);');
  });

  it('keeps every local scene animation inside the 43-second registry', () => {
    const hook = source('../scenes/HookScene.tsx');
    const website = source('../scenes/WebsiteScene.tsx');
    const products = source('../scenes/ProductsScene.tsx');
    const custom = source('../scenes/CustomScene.tsx');
    const handmade = source('../scenes/HandmadeScene.tsx');
    const features = source('../scenes/FeaturesScene.tsx');
    const shopping = source('../scenes/ShoppingFlowScene.tsx');
    const endCard = source('../scenes/EndCardScene.tsx');

    expect(hook).toContain('durationInFrames={120}');
    expect(website).toContain('durationInFrames={144}');
    expect(website).toContain(
      "const zoom = interpolate(frame, [0, 144], [0.96, 1], {extrapolateRight: 'clamp'});",
    );
    expect(products).toContain('durationInFrames={150}');
    expect(custom).toContain('durationInFrames={177}');
    expect(handmade).toContain('durationInFrames={174}');
    expect(features).toContain('durationInFrames={177}');
    expect(shopping).toContain('durationInFrames={147}');
    expect(endCard).toContain('durationInFrames={117}');
    expect(endCard).toContain('durationInFrames={84}');
  });

  it('preserves the final-state milestones before each shortened scene ends', () => {
    const hook = source('../scenes/HookScene.tsx');
    const custom = source('../scenes/CustomScene.tsx');
    const handmade = source('../scenes/HandmadeScene.tsx');
    const features = source('../scenes/FeaturesScene.tsx');
    const shopping = source('../scenes/ShoppingFlowScene.tsx');
    const endCard = source('../scenes/EndCardScene.tsx');

    expect(hook).toContain(
      "const t2Y = interpolate(frame, [62, 76], [20, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});",
    );
    expect(custom).toContain('const titleY = interpolate(frame, [124, 140], [18, 0], {');
    expect(handmade).toContain('const pathProgress = enter(frame, 0, 122);');
    expect(features).toContain(
      "{title: 'Mini game thú vị', subtitle: 'Chơi và nhận quà', icon: '🎮', screenshot: ASSETS.screenshots.miniGameDesktop, delay: 38},",
    );
    expect(features).toContain('const featureOpacity = enter(frame, feature.delay, 18);');
    expect(shopping).toContain('const mobileOpacity = enter(frame, 104, 20);');
    expect(shopping).toContain('const mobileY = interpolate(frame, [104, 124], [38, 0], {');
    expect(endCard).toContain('const text2Opacity = enter(frame, 70, 15);');
    expect(endCard).toContain('const settleProgress = enter(frame, 10, 60);');
  });

  it('uses the available visual headroom for larger focal artwork and legible copy', () => {
    const hook = source('../scenes/HookScene.tsx');
    const website = source('../scenes/WebsiteScene.tsx');
    const products = source('../scenes/ProductsScene.tsx');
    const custom = source('../scenes/CustomScene.tsx');
    const handmade = source('../scenes/HandmadeScene.tsx');
    const features = source('../scenes/FeaturesScene.tsx');
    const shopping = source('../scenes/ShoppingFlowScene.tsx');

    expect(hook).toContain('fontSize: 78');
    expect(hook).toContain('fontSize: 104');
    expect(website).toContain('fontSize: 62');
    expect(website).toContain('maxWidth: 1040');
    expect(products).toContain("category: 'Vòng tay'");
    expect(custom).toContain('fontSize: 70');
    expect(custom).toContain('[1, 1.08]');
    expect(handmade).toContain('width: 400');
    expect(handmade).toContain('height: 470');
    expect(features).toContain('width: 1320');
    expect(features).toContain('height: 248');
    expect(shopping).toContain('top: 220');
    expect(shopping).toContain('width: 300');
    expect(shopping).toContain('Mọi thiết bị');
  });

  it('spells the approved slogan exactly, including its comma and lowercase second clause', () => {
    const endCard = source('../scenes/EndCardScene.tsx');

    expect(endCard).toContain('Làm bằng tay,');
    expect(endCard).toContain('trao bằng tim');
    expect(endCard).not.toContain('Trao bằng tim');
  });
});
