import {AbsoluteFill, Sequence} from 'remotion';
import {SCENES, sceneDuration} from './content/scenes';
import {AmbientBackground} from './components/AmbientBackground';
import {ProgressLine} from './components/ProgressLine';
import {CaptionTrack} from './components/CaptionTrack';
import {AudioBed} from './components/AudioBed';
import {HookScene} from './scenes/HookScene';
import {WebsiteScene} from './scenes/WebsiteScene';
import {ProductsScene} from './scenes/ProductsScene';
import {CustomScene} from './scenes/CustomScene';
import {HandmadeScene} from './scenes/HandmadeScene';
import {FeaturesScene} from './scenes/FeaturesScene';
import {ShoppingFlowScene} from './scenes/ShoppingFlowScene';
import {EndCardScene} from './scenes/EndCardScene';

export const MushroomieIntro = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#071014'}}>
      <AmbientBackground />

      {/* 9 non-overlapping scene Sequences */}
      <Sequence from={SCENES[0].from} durationInFrames={sceneDuration(SCENES[0])} name="Hook">
        <HookScene />
      </Sequence>
      <Sequence from={SCENES[1].from} durationInFrames={sceneDuration(SCENES[1])} name="Website">
        <WebsiteScene />
      </Sequence>
      <Sequence from={SCENES[2].from} durationInFrames={sceneDuration(SCENES[2])} name="Products">
        <ProductsScene />
      </Sequence>
      <Sequence from={SCENES[3].from} durationInFrames={sceneDuration(SCENES[3])} name="Custom">
        <CustomScene />
      </Sequence>
      <Sequence from={SCENES[4].from} durationInFrames={sceneDuration(SCENES[4])} name="Handmade">
        <HandmadeScene />
      </Sequence>
      <Sequence from={SCENES[5].from} durationInFrames={sceneDuration(SCENES[5])} name="Features">
        <FeaturesScene />
      </Sequence>
      <Sequence from={SCENES[6].from} durationInFrames={sceneDuration(SCENES[6])} name="ShoppingFlow">
        <ShoppingFlowScene />
      </Sequence>
      <Sequence from={SCENES[7].from} durationInFrames={sceneDuration(SCENES[7])} name="Slogan">
        <EndCardScene mode="slogan" />
      </Sequence>
      <Sequence from={SCENES[8].from} durationInFrames={sceneDuration(SCENES[8])} name="CTA">
        <EndCardScene mode="cta" />
      </Sequence>

      <ProgressLine />
      <CaptionTrack />
      <AudioBed />
    </AbsoluteFill>
  );
};
