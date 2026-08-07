import {describe, expect, it} from 'vitest';
import {
  buildEdgeTtsArgs,
  buildFfprobeInvocation,
  buildSilenceDetectInvocation,
  parseSpokenEndSeconds,
  EDGE_VOICE,
  buildVoiceJobs,
} from '../../scripts/generate-voiceover';
import {NARRATION} from '../content/narration';
import {SCENES} from '../content/scenes';

describe('Vietnamese voice-over contract', () => {
  it('uses the approved Vietnamese male neural voice', () => {
    expect(EDGE_VOICE).toBe('vi-VN-NamMinhNeural');
    expect(buildVoiceJobs()).toHaveLength(9);
  });

  it('binds signed rates to the option for argparse compatibility', () => {
    const [hook] = buildVoiceJobs();
    const args = buildEdgeTtsArgs(hook);
    expect(args).toContain('--rate=+18%');
    expect(args).not.toContain('+18%');
  });

  it('invokes FFprobe through Node instead of a Windows cmd shim', () => {
    const invocation = buildFfprobeInvocation('scene-01.mp3');
    expect(invocation.command).toBe(process.execPath);
    expect(invocation.args[0]).toMatch(/remotion-cli\.js$/);
    expect(invocation.args).toContain('ffprobe');
    expect(invocation.args.at(-1)).toBe('scene-01.mp3');
  });

  it('invokes silence detection through the Remotion FFmpeg binary', () => {
    const invocation = buildSilenceDetectInvocation('scene-01.mp3');
    expect(invocation.command).toBe(process.execPath);
    expect(invocation.args[0]).toMatch(/remotion-cli\.js$/);
    expect(invocation.args).toContain('ffmpeg');
    expect(invocation.args).toContain('silencedetect=noise=-40dB:d=0.15');
    expect(invocation.args).toContain('scene-01.mp3');
  });

  it('uses the start of EOF silence as the last spoken sample', () => {
    const output = [
      'silence_start: 1.7605',
      'silence_end: 2.022417 | silence_duration: 0.261917',
      'silence_start: 4.323042',
      'silence_end: 4.968 | silence_duration: 0.644958',
    ].join('\n');

    expect(parseSpokenEndSeconds(output, 4.968)).toBeCloseTo(4.323042, 6);
  });

  it('uses the physical duration when the file has no trailing silence', () => {
    expect(parseSpokenEndSeconds('silence_end: 2.0', 4.968)).toBe(4.968);
  });

  it('assigns one unique local clip to every scene', () => {
    expect(NARRATION).toHaveLength(9);
    expect(new Set(NARRATION.map(({audio}) => audio)).size).toBe(9);
    expect(NARRATION.map(({audio}) => audio)).toEqual(
      Array.from(
        {length: 9},
        (_, index) =>
          `audio/voice/scene-${String(index + 1).padStart(2, '0')}.mp3`,
      ),
    );
  });

  it('uses explicit Edge TTS rates and matching scene identifiers', () => {
    expect(NARRATION.map(({scene}) => scene)).toEqual(
      SCENES.map(({id}) => id),
    );
    for (const {rate} of NARRATION) {
      expect(rate).toMatch(/^[+-]\d+%$/);
    }
  });

  it('uses an explicit energetic volume for every scene', () => {
    for (const record of NARRATION) {
      expect(record.volume).toMatch(/^\+\d+%$/);
    }

    expect(buildEdgeTtsArgs(buildVoiceJobs()[0])).toContain('--volume=+8%');
  });

  it('keeps the hook brisk and the slogan warm', () => {
    expect(NARRATION[0].rate).toBe('+18%');
    expect(NARRATION[0].pitch).toBe('+12Hz');
    expect(NARRATION[7].rate).toBe('+12%');
  });

  it('uses the measured CTA rate that preserves the full spoken domain', () => {
    expect(NARRATION[8].rate).toBe('+75%');
  });

  it('keeps a 0.35-second spoken-audio safety margin in every scene', () => {
    expect(
      buildVoiceJobs().map(({allowedSeconds}) =>
        Math.round(allowedSeconds * 100) / 100,
      ),
    ).toEqual([3.65, 4.45, 4.65, 5.55, 5.45, 5.55, 4.55, 3.55, 2.45]);
  });

  it('gives every narration a positive spoken-audio window', () => {
    for (const job of buildVoiceJobs()) {
      expect(job.allowedSeconds).toBeGreaterThan(0);
    }
  });
});
