import {mkdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NARRATION} from '../src/content/narration';
import {SCENES} from '../src/content/scenes';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(scriptDirectory, '..', 'public');
const fontDirectory = path.join(publicDirectory, 'fonts');

const visibleCopy = [
  ...NARRATION.map(({text}) => text),
  ...SCENES.flatMap(({emphasis}) => emphasis),
  'Mushroomie Không gian handmade của riêng bạn',
  'Tìm món phụ kiện hợp gu Vòng tay Charm Móc khóa',
  'Màu sắc Hạt Dấu ấn của riêng bạn',
  'Chọn vật liệu Phối chi tiết Hoàn thiện & đóng gói',
  'Câu chuyện thương hiệu Bài viết mới Voucher dành riêng Mini game thú vị',
  'Xem sản phẩm Thêm vào giỏ Đặt hàng Desktop & mobile Khám phá ngay',
].join(' ');

const subset = [...new Set(visibleCopy)].sort().join('');

const jobs = [
  {family: 'Paytone One', weight: 400, output: 'paytone-one-400.woff2'},
  {family: 'Montserrat', weight: 400, output: 'montserrat-400.woff2'},
  {family: 'Montserrat', weight: 600, output: 'montserrat-600.woff2'},
  {family: 'Montserrat', weight: 700, output: 'montserrat-700.woff2'},
  {family: 'Montserrat', weight: 800, output: 'montserrat-800.woff2'},
] as const;

const browserUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

const cssUrlFor = (family: string, weight: number) => {
  const familyQuery = `${family.replaceAll(' ', '+')}:wght@${weight}`;
  return `https://fonts.googleapis.com/css2?family=${familyQuery}&display=block&text=${encodeURIComponent(subset)}`;
};

const extractWoff2Url = (css: string) => {
  const match = css.match(/url\(([^)]+)\)\s+format\(['"]woff2['"]\)/i);
  if (!match) {
    throw new Error(`Google Fonts response did not contain WOFF2:\n${css}`);
  }

  return match[1].replace(/^['"]|['"]$/g, '');
};

await mkdir(fontDirectory, {recursive: true});

for (const job of jobs) {
  const cssResponse = await fetch(cssUrlFor(job.family, job.weight), {
    headers: {'user-agent': browserUserAgent},
  });

  if (!cssResponse.ok) {
    throw new Error(
      `Google Fonts CSS failed for ${job.family} ${job.weight}: ${cssResponse.status}`,
    );
  }

  const fontUrl = extractWoff2Url(await cssResponse.text());
  const fontResponse = await fetch(fontUrl, {
    headers: {'user-agent': browserUserAgent},
  });

  if (!fontResponse.ok) {
    throw new Error(
      `Font download failed for ${job.family} ${job.weight}: ${fontResponse.status}`,
    );
  }

  const output = path.join(fontDirectory, job.output);
  await writeFile(output, Buffer.from(await fontResponse.arrayBuffer()));
  const outputStats = await stat(output);

  if (!outputStats.isFile() || outputStats.size <= 1024) {
    throw new Error(`Downloaded font is unexpectedly small: ${output}`);
  }

  console.log(`Downloaded ${job.output} (${outputStats.size} bytes)`);
}
