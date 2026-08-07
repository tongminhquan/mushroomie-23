import {AbsoluteFill, interpolate, useCurrentFrame, Easing, Img, staticFile} from 'remotion';
import {THEME} from '../content/theme';
import {ASSETS} from '../lib/assets';
import {SceneShell} from '../components/SceneShell';
import {enter} from '../lib/motion';

export const HandmadeScene = () => {
  const frame = useCurrentFrame();

  const steps = [
    {title: 'Chọn vật liệu', image: ASSETS.products.braceletGreen},
    {title: 'Phối chi tiết', image: ASSETS.products.keychainsBlue},
    {title: 'Hoàn thiện & đóng gói', image: ASSETS.products.necklaceFlowers},
  ];

  const pathProgress = enter(frame, 0, 122);

  return (
    <SceneShell durationInFrames={270} accent="#b9794b">
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        
        {/* Bead Path Visual */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '15%',
          right: '15%',
          height: 4,
          backgroundColor: THEME.colors.backgroundRaised,
          zIndex: 0,
        }}>
          <div style={{
            height: '100%',
            backgroundColor: THEME.colors.yellow,
            width: '100%',
            transform: `scaleX(${pathProgress})`,
            transformOrigin: 'left center',
          }} />
        </div>

        <div style={{display: 'flex', gap: 60, zIndex: 1}}>
          {steps.map((step, i) => {
            const delay = i * 36 - 8;
            const stepOpacity = enter(frame, delay, 20);
            const stepY = interpolate(frame, [delay, delay + 20], [50, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5))});

            return (
              <div key={step.title} style={{
                width: 400,
                height: 470,
                backgroundColor: THEME.colors.backgroundRaised,
                borderRadius: THEME.radii.card,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
                opacity: stepOpacity,
                transform: `translateY(${stepY}px)`,
                border: `2px solid ${THEME.colors.kraft}`
              }}>
                <Img src={staticFile(step.image)} style={{width: 260, height: 260, borderRadius: THEME.radii.small, objectFit: 'cover'}} />
                <h3 style={{
                  fontFamily: THEME.fonts.heading,
                  fontSize: 30,
                  lineHeight: 1.2,
                  color: THEME.colors.yellow,
                  margin: 0,
                  textAlign: 'center'
                }}>
                  {step.title}
                </h3>
              </div>
            );
          })}
        </div>

      </AbsoluteFill>
    </SceneShell>
  );
};
