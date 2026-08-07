import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('visual presentation contracts', () => {
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

  it('keeps product-card sizing coherent and removes CSS transition timing from the custom scene', () => {
    const products = source('../scenes/ProductsScene.tsx');
    const custom = source('../scenes/CustomScene.tsx');
    const card = source('../components/ProductCard.tsx');

    expect(products).not.toContain('style={{width: 400}}');
    expect(products).toContain("transform: 'translateY(-54px)'");
    expect(custom).not.toContain('style={{width: 480}}');
    expect(custom).not.toContain('transition:');
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
    expect(shopping).not.toContain('bottom: THEME.safe.y');
    expect(audio).toContain('durationInFrames={sceneDuration(scene)}');
    expect(captions).toContain('fontSize: 38');
    expect(captions).toContain('maxHeight: 38 * 1.35 * 2 + 24');
    expect(captions).toContain('paddingBottom: 108');
  });

  it('settles the domain and CTA during the short final scene', () => {
    const endCard = source('../scenes/EndCardScene.tsx');

    expect(endCard).toContain('const domainOpacity = enter(frame, 10, 16);');
    expect(endCard).toContain('const btnOpacity = enter(frame, 20, 16);');
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
