import {describe, expect, it} from 'vitest';
import {SCENES, sceneDuration} from '../content/scenes';

describe('scene registry', () => {
  it('maps all nine scenes with correct durations', () => {
    const expectedDurations: Record<string, number> = {
      hook: 150,
      website: 180,
      products: 210,
      custom: 270,
      handmade: 270,
      features: 240,
      'shopping-flow': 240,
      slogan: 150,
      cta: 90,
    };
    for (const scene of SCENES) {
      expect(sceneDuration(scene)).toBe(expectedDurations[scene.id]);
    }
  });

  it('covers the full 1800-frame timeline continuously', () => {
    expect(SCENES[0].from).toBe(0);
    for (let i = 1; i < SCENES.length; i++) {
      expect(SCENES[i].from).toBe(SCENES[i - 1].to + 1);
    }
    expect(SCENES[SCENES.length - 1].to).toBe(1799);
  });
});
