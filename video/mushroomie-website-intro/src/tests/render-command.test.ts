import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as {scripts: Record<string, string>};

describe('master render command', () => {
  it('uses a bounded concurrency and longer timeout so local font loads are not starved', () => {
    const command = packageJson.scripts['render:master'];

    expect(command).toContain('--concurrency=2');
    expect(command).toContain('--timeout=60000');
    expect(command).toContain('mushroomie-website-intro-43s-master.mp4');
    expect(command).not.toContain('mushroomie-website-intro-master.mp4');
  });

  it('renders the vertical master to a unique path', () => {
    expect(packageJson.scripts['render:vertical-master']).toContain(
      'MushroomieWebsiteIntroVertical',
    );
    expect(packageJson.scripts['render:vertical-master']).toContain(
      'mushroomie-website-intro-43s-9x16-tiktok-master.mp4',
    );
  });
});
