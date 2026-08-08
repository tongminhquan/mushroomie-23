import {Composition} from 'remotion';
import {
  COMPOSITION_ID,
  VERTICAL_COMPOSITION_ID,
  VERTICAL_VIDEO_CONFIG,
  VIDEO_CONFIG,
} from './config';
import {MushroomieIntro} from './MushroomieIntro';
import {MushroomieIntroVertical} from './MushroomieIntroVertical';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={MushroomieIntro}
        durationInFrames={VIDEO_CONFIG.durationInFrames}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />
      <Composition
        id={VERTICAL_COMPOSITION_ID}
        component={MushroomieIntroVertical}
        durationInFrames={VERTICAL_VIDEO_CONFIG.durationInFrames}
        fps={VERTICAL_VIDEO_CONFIG.fps}
        width={VERTICAL_VIDEO_CONFIG.width}
        height={VERTICAL_VIDEO_CONFIG.height}
      />
    </>
  );
};
