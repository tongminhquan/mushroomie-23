import {describe, expect, it} from 'vitest';

describe('final video delivery pipeline', () => {
  it('encodes the master as web-safe H.264, yuv420p, and stereo AAC', async () => {
    const {buildFinalEncodeArgs} = await import('../../scripts/finalize-render.mjs');
    const args = buildFinalEncodeArgs('master.mp4', 'final.mp4');

    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-pix_fmt');
    expect(args).toContain('yuv420p');
    expect(args).toContain('-vf');
    expect(args).toContain('scale=in_range=pc:out_range=tv,format=yuv420p');
    expect(args).toContain('-c:a');
    expect(args).toContain('aac');
    expect(args).toContain('-ac');
    expect(args).toContain('2');
    expect(args).toContain('loudnorm=I=-16:LRA=11:TP=-1.5');
  });

  it('creates a five-frame final contact sheet at deterministic 12-second intervals', async () => {
    const {buildFinalContactSheetArgs} = await import('../../scripts/finalize-render.mjs');
    const args = buildFinalContactSheetArgs('final.mp4', 'final-contact-sheet.jpg');

    expect(args).toContain('fps=1/12,scale=480:-1:flags=lanczos,tile=5x1:padding=8:margin=8:color=0x071014');
    expect(args.slice(-1)).toEqual(['final-contact-sheet.jpg']);
  });
});
