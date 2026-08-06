import React from 'react';
import { Sequence, useCurrentFrame, interpolate, staticFile } from 'remotion';
import { Audio } from '@remotion/media';
import { SCENES, sceneDuration } from '../content/scenes';
import { NARRATION } from '../content/narration';
import { VIDEO_CONFIG } from '../config';
import { ASSETS } from '../lib/assets';

export const AudioBed: React.FC = () => {
  const frame = useCurrentFrame();

  // Music volume 0.12 with 45-frame fade-in and 60-frame fade-out
  const musicVolume = interpolate(
    frame,
    [0, 45, VIDEO_CONFIG.durationInFrames - 60, VIDEO_CONFIG.durationInFrames],
    [0, 0.12, 0.12, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const whooshScenes = ['website', 'products', 'features', 'shopping-flow'];
  const shimmerScenes = ['slogan', 'cta'];
  const customScene = SCENES.find(s => s.id === 'custom');

  return (
    <>
      <Audio src={staticFile(ASSETS.audio.music)} volume={musicVolume} />

      {SCENES.map((scene, index) => {
        const narration = NARRATION[index];
        return (
          <Sequence key={`voice-${scene.id}`} from={scene.from} durationInFrames={sceneDuration(scene)}>
            <Audio src={staticFile(narration.audio)} volume={1.0} />
          </Sequence>
        );
      })}

      {SCENES.map((scene) => {
        if (whooshScenes.includes(scene.id)) {
          return (
            <Sequence key={`whoosh-${scene.id}`} from={scene.from} durationInFrames={18}>
              <Audio src={staticFile(ASSETS.audio.sfx.whoosh)} volume={0.12} />
            </Sequence>
          );
        }
        if (shimmerScenes.includes(scene.id)) {
          return (
            <Sequence key={`shimmer-${scene.id}`} from={scene.from} durationInFrames={42}>
              <Audio src={staticFile(ASSETS.audio.sfx.shimmer)} volume={0.1} />
            </Sequence>
          );
        }
        return null;
      })}

      {customScene && (
        <>
          <Sequence from={customScene.from + 30} durationInFrames={6}>
            <Audio src={staticFile(ASSETS.audio.sfx.pop)} volume={0.08} />
          </Sequence>
          <Sequence from={customScene.from + 72} durationInFrames={6}>
            <Audio src={staticFile(ASSETS.audio.sfx.pop)} volume={0.08} />
          </Sequence>
          <Sequence from={customScene.from + 114} durationInFrames={6}>
            <Audio src={staticFile(ASSETS.audio.sfx.pop)} volume={0.08} />
          </Sequence>
        </>
      )}
    </>
  );
};
