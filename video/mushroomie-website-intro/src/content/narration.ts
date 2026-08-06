import type {SceneId} from './scenes';

export type NarrationRecord = {
  scene: SceneId;
  text: string;
  rate: `${'+' | '-'}${number}%`;
  pitch: `${'+' | '-'}${number}Hz`;
  audio: `audio/voice/scene-${string}.mp3`;
};

/**
 * Narration text uses phonetic "Mát-shrù-mi" for correct pronunciation
 * of "Mushroomie" by the Vietnamese TTS engine.
 * Pitch and rate tuned per scene for emotional engagement.
 */
export const NARRATION = [
  {
    scene: 'hook',
    text: 'Một món phụ kiện nhỏ, có thể kể câu chuyện rất riêng của bạn.',
    rate: '+5%',
    pitch: '+5Hz',
    audio: 'audio/voice/scene-01.mp3',
  },
  {
    scene: 'website',
    text: 'Mát-shrù-mi là không gian dành cho vòng tay, charm, móc khóa và phụ kiện handmade, cá nhân hóa.',
    rate: '+25%',
    pitch: '+10Hz',
    audio: 'audio/voice/scene-02.mp3',
  },
  {
    scene: 'products',
    text: 'Từ những thiết kế có sẵn, đến sản phẩm custom, bạn dễ dàng khám phá phong cách phù hợp, ngay trên website.',
    rate: '+25%',
    pitch: '+8Hz',
    audio: 'audio/voice/scene-03.mp3',
  },
  {
    scene: 'custom',
    text: 'Chọn màu sắc, hạt và charm bạn yêu thích. Mát-shrù-mi biến từng ý tưởng, thành món phụ kiện mang dấu ấn riêng.',
    rate: '+20%',
    pitch: '+12Hz',
    audio: 'audio/voice/scene-04.mp3',
  },
  {
    scene: 'handmade',
    text: 'Mỗi sản phẩm, được làm thủ công, chăm chút từ khâu chọn vật liệu, phối chi tiết, đến hoàn thiện và đóng gói.',
    rate: '+15%',
    pitch: '+5Hz',
    audio: 'audio/voice/scene-05.mp3',
  },
  {
    scene: 'features',
    text: 'Không chỉ mua sắm, bạn còn có thể khám phá câu chuyện thương hiệu, bài viết, voucher, và mini game thú vị.',
    rate: '+25%',
    pitch: '+10Hz',
    audio: 'audio/voice/scene-06.mp3',
  },
  {
    scene: 'shopping-flow',
    text: 'Giao diện rõ ràng, giúp bạn xem sản phẩm, thêm vào giỏ, và đặt hàng nhanh chóng, trên mọi thiết bị.',
    rate: '+20%',
    pitch: '+8Hz',
    audio: 'audio/voice/scene-07.mp3',
  },
  {
    scene: 'slogan',
    text: 'Mát-shrù-mi... làm bằng tay... trao bằng tim.',
    rate: '+0%',
    pitch: '+2Hz',
    audio: 'audio/voice/scene-08.mp3',
  },
  {
    scene: 'cta',
    text: 'Khám phá ngay tại mát-shrù-mi chấm ai ô chấm vi en!',
    rate: '+75%',
    pitch: '+15Hz',
    audio: 'audio/voice/scene-09.mp3',
  },
] as const satisfies readonly NarrationRecord[];
