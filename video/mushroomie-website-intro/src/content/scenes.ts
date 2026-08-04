export type SceneId =
  | 'hook'
  | 'website'
  | 'products'
  | 'custom'
  | 'handmade'
  | 'features'
  | 'shopping-flow'
  | 'slogan'
  | 'cta';

export const SCENES = [
  {
    id: 'hook',
    from: 0,
    to: 149,
    accent: '#e41d1d',
    emphasis: ['Một món phụ kiện', 'Một câu chuyện riêng'],
  },
  {
    id: 'website',
    from: 150,
    to: 329,
    accent: '#ffd6d6',
    emphasis: ['Handmade', 'Cá nhân hóa'],
  },
  {
    id: 'products',
    from: 330,
    to: 539,
    accent: '#ffe7a3',
    emphasis: ['Thiết kế có sẵn', 'Sản phẩm custom'],
  },
  {
    id: 'custom',
    from: 540,
    to: 809,
    accent: '#e41d1d',
    emphasis: ['Màu sắc · Hạt · Charm', 'Dấu ấn riêng'],
  },
  {
    id: 'handmade',
    from: 810,
    to: 1079,
    accent: '#b9794b',
    emphasis: ['Làm thủ công', 'Chăm chút từng chi tiết'],
  },
  {
    id: 'features',
    from: 1080,
    to: 1319,
    accent: '#ffd6d6',
    emphasis: ['Câu chuyện · Bài viết · Voucher · Mini game'],
  },
  {
    id: 'shopping-flow',
    from: 1320,
    to: 1559,
    accent: '#ffe7a3',
    emphasis: ['Xem sản phẩm → Giỏ hàng → Đặt hàng'],
  },
  {
    id: 'slogan',
    from: 1560,
    to: 1709,
    accent: '#ffe7a3',
    emphasis: ['Làm bằng tay', 'Trao bằng tim'],
  },
  {
    id: 'cta',
    from: 1710,
    to: 1799,
    accent: '#e41d1d',
    emphasis: ['Khám phá ngay', 'mushroomie.io.vn'],
  },
] as const satisfies ReadonlyArray<{
  id: SceneId;
  from: number;
  to: number;
  accent: string;
  emphasis: readonly string[];
}>;

export const sceneDuration = (scene: {from: number; to: number}) =>
  scene.to - scene.from + 1;
