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

  it('uses the 43-second delivery filenames and creates a five-frame contact sheet at deterministic 10-second intervals', async () => {
    const {
      buildFinalContactSheetArgs,
      FINAL_CONTACT_SHEET_FILENAME,
      FINAL_FILENAME,
      MASTER_FILENAME,
    } = await import('../../scripts/finalize-render.mjs');
    const args = buildFinalContactSheetArgs('final.mp4', 'final-contact-sheet-43s.jpg');

    expect(MASTER_FILENAME).toBe('mushroomie-website-intro-43s-master.mp4');
    expect(FINAL_FILENAME).toBe('mushroomie-website-intro-43s-16x9-v1.mp4');
    expect(FINAL_CONTACT_SHEET_FILENAME).toBe('final-contact-sheet-43s.jpg');
    expect(args).toContain(
      'fps=1/10,scale=480:-1:flags=lanczos,tile=5x1:padding=8:margin=8:color=0x071014',
    );
    expect(args.slice(-1)).toEqual(['final-contact-sheet-43s.jpg']);
  });

  it('uses independent vertical delivery names', async () => {
    const verticalFinal = await import('../../scripts/finalize-vertical-render.mjs');

    expect(verticalFinal.VERTICAL_MASTER_FILENAME).toBe(
      'mushroomie-website-intro-43s-9x16-tiktok-master.mp4',
    );
    expect(verticalFinal.VERTICAL_FINAL_FILENAME).toBe(
      'mushroomie-website-intro-43s-9x16-tiktok-v1.mp4',
    );
    expect(verticalFinal.VERTICAL_CONTACT_SHEET_FILENAME).toBe(
      'final-contact-sheet-43s-9x16-tiktok.jpg',
    );
  });
});
