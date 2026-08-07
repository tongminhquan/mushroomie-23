import {describe, expect, it} from 'vitest';

describe('key-frame review', () => {
  it('exports ten representative key frames in story order', async () => {
    const {KEY_FRAMES} = await import('../../scripts/render-keyframes.mjs');
    expect(KEY_FRAMES).toEqual([75, 255, 435, 735, 945, 1200, 1440, 1640, 1740, 1770]);
    for (let i = 1; i < KEY_FRAMES.length; i++) {
      expect(KEY_FRAMES[i]).toBeGreaterThan(KEY_FRAMES[i - 1]);
    }
    expect(KEY_FRAMES.every((f: number) => f >= 0 && f <= 1799)).toBe(true);
  });

  it('invokes a full FFmpeg binary directly for the labeled contact sheet', async () => {
    const {buildFullFfmpegInvocation} = await import(
      '../../scripts/render-keyframes.mjs'
    );
    expect(
      buildFullFfmpegInvocation(['-version'], 'C:\\tools\\ffmpeg.exe'),
    ).toEqual({
      command: 'C:\\tools\\ffmpeg.exe',
      args: ['-version'],
    });
  });

  it('escapes an explicit Windows font path for drawtext', async () => {
    const {buildDrawTextFilter} = await import(
      '../../scripts/render-keyframes.mjs'
    );
    expect(buildDrawTextFilter(0, 0, 'C:\\Windows\\Fonts\\arial.ttf')).toContain(
      "fontfile='C\\:/Windows/Fonts/arial.ttf'",
    );
  });
});
