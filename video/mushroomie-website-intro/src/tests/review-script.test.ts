import {describe, expect, it} from 'vitest';

describe('key-frame review', () => {
  it('exports ten representative key frames in story order', async () => {
    const {KEY_FRAMES} = await import('../../scripts/render-keyframes.mjs');
    expect(KEY_FRAMES).toEqual([90, 210, 354, 559, 720, 855, 1072, 1190, 1260, 1276]);
    for (let i = 1; i < KEY_FRAMES.length; i++) {
      expect(KEY_FRAMES[i]).toBeGreaterThan(KEY_FRAMES[i - 1]);
    }
    expect(KEY_FRAMES.every((frame: number) => frame >= 0 && frame <= 1289)).toBe(true);
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

  it('uses independent vertical still-review names', async () => {
    const vertical = await import('../../scripts/render-vertical-keyframes.mjs');

    expect(vertical.VERTICAL_COMPOSITION_ID).toBe('MushroomieWebsiteIntroVertical');
    expect(vertical.VERTICAL_KEYFRAMES_DIRECTORY).toBe('vertical-keyframes');
    expect(vertical.VERTICAL_CONTACT_SHEET_FILENAME).toBe(
      'vertical-keyframes-contact-sheet.jpg',
    );
  });
});
