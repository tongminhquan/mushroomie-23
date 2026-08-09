import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

const composition = readFileSync(
  new URL('../MushroomieIntro.tsx', import.meta.url),
  'utf8',
);

const theme = readFileSync(
  new URL('../content/theme.ts', import.meta.url),
  'utf8',
);

describe('renderer font bootstrap', () => {
  it('uses stable installed font stacks and avoids the hanging FontFace loader', () => {
    expect(composition).not.toContain("import './lib/fonts'");
    expect(theme).toContain('Segoe UI Black');
    expect(theme).toContain('Segoe UI');
  });
});
