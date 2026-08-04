import {describe, expect, it} from 'vitest';
import {
  AUDIO_OUTPUTS,
  buildAudioJobs,
  buildFfmpegInvocation,
} from '../../scripts/generate-audio.mjs';

describe('generated audio contract', () => {
  it('defines one music bed and three restrained effects', () => {
    expect(Object.keys(AUDIO_OUTPUTS)).toEqual([
      'music',
      'whoosh',
      'pop',
      'shimmer',
    ]);
    expect(buildAudioJobs()).toHaveLength(4);
  });

  it('locks the music bed to 60 seconds at 48 kHz', () => {
    const music = buildAudioJobs().find(({key}) => key === 'music');
    expect(music).toBeDefined();
    const args = music?.args.join(' ') ?? '';
    expect(args).toContain('duration=60');
    expect(args).toContain('48000');
  });

  it('writes only local PCM WAV outputs', () => {
    for (const output of Object.values(AUDIO_OUTPUTS)) {
      expect(output).toMatch(/^audio\/(?:music|sfx)\/[a-z-]+\.wav$/);
      expect(output).not.toMatch(/^https?:|localhost|127\.0\.0\.1/i);
    }
    for (const job of buildAudioJobs()) {
      expect(job.args).toContain('pcm_s16le');
    }
  });

  it('uses finite symmetric fades for the pink-noise whoosh', () => {
    const whoosh = buildAudioJobs().find(({key}) => key === 'whoosh');
    const args = whoosh?.args.join(' ') ?? '';
    expect(args).toContain('afade=t=in:st=0:d=0.225');
    expect(args).toContain('afade=t=out:st=0.225:d=0.225');
    expect(args).not.toContain("volume='if(lt(t");
  });

  it('uses a finite exponential fade for the pop decay', () => {
    const pop = buildAudioJobs().find(({key}) => key === 'pop');
    const args = pop?.args.join(' ') ?? '';
    expect(args).toContain('afade=t=out:st=0:d=0.16:curve=exp');
    expect(args).not.toContain('exp(-18*t)');
  });

  it('invokes the full FFmpeg binary directly without a cmd shim', () => {
    const invocation = buildFfmpegInvocation(
      ['-version'],
      'C:\\tools\\ffmpeg.exe',
    );
    expect(invocation).toEqual({
      command: 'C:\\tools\\ffmpeg.exe',
      args: ['-version'],
    });
  });
});
