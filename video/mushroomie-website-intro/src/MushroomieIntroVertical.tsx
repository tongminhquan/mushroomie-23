import {AbsoluteFill, Sequence} from 'remotion';
import {AmbientBackground} from './components/AmbientBackground';
import {AudioBed} from './components/AudioBed';
import {SCENES, sceneDuration} from './content/scenes';
import {VerticalCaptionTrack} from './vertical/VerticalCaptionTrack';
import {VerticalProgressLine} from './vertical/VerticalProgressLine';
import {VerticalCustomScene} from './vertical/scenes/VerticalCustomScene';
import {VerticalEndCardScene} from './vertical/scenes/VerticalEndCardScene';
import {VerticalFeaturesScene} from './vertical/scenes/VerticalFeaturesScene';
import {VerticalHandmadeScene} from './vertical/scenes/VerticalHandmadeScene';
import {VerticalHookScene} from './vertical/scenes/VerticalHookScene';
import {VerticalProductsScene} from './vertical/scenes/VerticalProductsScene';
import {VerticalShoppingFlowScene} from './vertical/scenes/VerticalShoppingFlowScene';
import {VerticalWebsiteScene} from './vertical/scenes/VerticalWebsiteScene';

export const MushroomieIntroVertical = () => (
  <AbsoluteFill style={{backgroundColor: '#071014'}}>
    <AmbientBackground />
    <Sequence
      from={SCENES[0].from}
      durationInFrames={sceneDuration(SCENES[0])}
      name="Vertical Hook"
    >
      <VerticalHookScene />
    </Sequence>
    <Sequence
      from={SCENES[1].from}
      durationInFrames={sceneDuration(SCENES[1])}
      name="Vertical Website"
    >
      <VerticalWebsiteScene />
    </Sequence>
    <Sequence
      from={SCENES[2].from}
      durationInFrames={sceneDuration(SCENES[2])}
      name="Vertical Products"
    >
      <VerticalProductsScene />
    </Sequence>
    <Sequence
      from={SCENES[3].from}
      durationInFrames={sceneDuration(SCENES[3])}
      name="Vertical Custom"
    >
      <VerticalCustomScene />
    </Sequence>
    <Sequence
      from={SCENES[4].from}
      durationInFrames={sceneDuration(SCENES[4])}
      name="Vertical Handmade"
    >
      <VerticalHandmadeScene />
    </Sequence>
    <Sequence
      from={SCENES[5].from}
      durationInFrames={sceneDuration(SCENES[5])}
      name="Vertical Features"
    >
      <VerticalFeaturesScene />
    </Sequence>
    <Sequence
      from={SCENES[6].from}
      durationInFrames={sceneDuration(SCENES[6])}
      name="Vertical Shopping Flow"
    >
      <VerticalShoppingFlowScene />
    </Sequence>
    <Sequence
      from={SCENES[7].from}
      durationInFrames={sceneDuration(SCENES[7])}
      name="Vertical Slogan"
    >
      <VerticalEndCardScene mode="slogan" />
    </Sequence>
    <Sequence
      from={SCENES[8].from}
      durationInFrames={sceneDuration(SCENES[8])}
      name="Vertical CTA"
    >
      <VerticalEndCardScene mode="cta" />
    </Sequence>
    <VerticalProgressLine />
    <VerticalCaptionTrack />
    <AudioBed />
  </AbsoluteFill>
);
