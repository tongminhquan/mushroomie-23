import {describe, expect, it} from 'vitest';

describe('render metadata validator', () => {
  it('accepts valid metadata', async () => {
    const {validateMetadata} = await import('../../scripts/verify-render.mjs');
    const valid = {
      duration: 60.0,
      width: 1920,
      height: 1080,
      fps: 30,
      videoCodec: 'h264',
      pixFmt: 'yuv420p',
      audioCodec: 'aac',
      channels: 2,
      fileSizeBytes: 5_000_000,
    };
    expect(validateMetadata(valid)).toEqual([]);
  });

  it('rejects eight invalid fields', async () => {
    const {validateMetadata} = await import('../../scripts/verify-render.mjs');
    const invalid = {
      duration: 45,
      width: 1280,
      height: 720,
      fps: 24,
      videoCodec: 'vp9',
      pixFmt: 'rgb24',
      audioCodec: 'mp3',
      channels: 1,
      fileSizeBytes: 500,
    };
    const errors = validateMetadata(invalid);
    expect(errors.length).toBe(9);
  });

  it('rejects an almost-30 frame rate that is not the approved 30 fps contract', async () => {
    const {validateMetadata} = await import('../../scripts/verify-render.mjs');
    const errors = validateMetadata({
      duration: 60,
      width: 1920,
      height: 1080,
      fps: 29,
      videoCodec: 'h264',
      pixFmt: 'yuv420p',
      audioCodec: 'aac',
      channels: 2,
      fileSizeBytes: 5_000_000,
    });

    expect(errors.some((error: string) => error.includes('FPS'))).toBe(true);
  });
});
