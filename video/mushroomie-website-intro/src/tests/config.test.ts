import {describe, expect, it} from 'vitest';
import {COMPOSITION_ID, VIDEO_CONFIG} from '../config';

describe('video contract', () => {
  it('locks the approved Full HD composition', () => {
    expect(COMPOSITION_ID).toBe('MushroomieWebsiteIntro');
    expect(VIDEO_CONFIG).toEqual({
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 1290,
    });
  });
});
