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
    to: 119,
    accent: '#e41d1d',
    emphasis: ['Một món phụ kiện', 'Một câu chuyện riêng'],
  },
  {
    id: 'website',
    from: 120,
    to: 263,
    accent: '#ffd6d6',
    emphasis: ['Handmade', 'Cá nhân hóa'],
  },
  {
    id: 'products',
    from: 264,
    to: 413,
    accent: '#ffe7a3',
    emphasis: ['Thiết kế có sẵn', 'Sản phẩm custom'],
  },
  {
    id: 'custom',
    from: 414,
    to: 590,
    accent: '#e41d1d',
    emphasis: ['Màu sắc · Hạt · Charm', 'Dấu ấn riêng'],
  },
  {
    id: 'handmade',
    from: 591,
    to: 764,
    accent: '#b9794b',
    emphasis: ['Làm thủ công', 'Chăm chút từng chi tiết'],
  },
  {
    id: 'features',
    from: 765,
    to: 941,
    accent: '#ffd6d6',
    emphasis: ['Câu chuyện · Bài viết · Voucher · Mini game'],
  },
  {
    id: 'shopping-flow',
    from: 942,
    to: 1088,
    accent: '#ffe7a3',
    emphasis: ['Xem sản phẩm → Giỏ hàng → Đặt hàng'],
  },
  {
    id: 'slogan',
    from: 1089,
    to: 1205,
    accent: '#ffe7a3',
    emphasis: ['Làm bằng tay', 'Trao bằng tim'],
  },
  {
    id: 'cta',
    from: 1206,
    to: 1289,
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
