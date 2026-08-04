import {Composition} from 'remotion';
import {COMPOSITION_ID, VIDEO_CONFIG} from './config';
import {MushroomieIntro} from './MushroomieIntro';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id={COMPOSITION_ID}
      component={MushroomieIntro}
      durationInFrames={VIDEO_CONFIG.durationInFrames}
      fps={VIDEO_CONFIG.fps}
      width={VIDEO_CONFIG.width}
      height={VIDEO_CONFIG.height}
    />
  );
};
