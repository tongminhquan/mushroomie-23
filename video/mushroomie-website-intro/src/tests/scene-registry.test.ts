import {describe, expect, it} from 'vitest';
import {SCENES, sceneDuration} from '../content/scenes';

describe('scene registry', () => {
  it('maps all nine scenes onto the approved 43-second timeline', () => {
    const expectedDurations: Record<string, number> = {
      hook: 120,
      website: 144,
      products: 150,
      custom: 177,
      handmade: 174,
      features: 177,
      'shopping-flow': 147,
      slogan: 117,
      cta: 84,
    };

    expect(SCENES).toHaveLength(9);
    for (const scene of SCENES) {
      expect(sceneDuration(scene)).toBe(expectedDurations[scene.id]);
    }

    expect(SCENES[0].from).toBe(0);
    for (let index = 1; index < SCENES.length; index++) {
      expect(SCENES[index].from).toBe(SCENES[index - 1].to + 1);
    }
    expect(SCENES.at(-1)?.to).toBe(1289);
    expect(SCENES.reduce((sum, scene) => sum + sceneDuration(scene), 0)).toBe(1290);
  });
});
