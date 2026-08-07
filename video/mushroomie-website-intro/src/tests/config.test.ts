import {describe, expect, it} from 'vitest';
import {
  COMPOSITION_ID,
  VERTICAL_COMPOSITION_ID,
  VERTICAL_VIDEO_CONFIG,
  VIDEO_CONFIG,
} from '../config';

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

  it('locks the approved TikTok composition', () => {
    expect(VERTICAL_COMPOSITION_ID).toBe('MushroomieWebsiteIntroVertical');
    expect(VERTICAL_VIDEO_CONFIG).toEqual({
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 1290,
    });
  });
});
