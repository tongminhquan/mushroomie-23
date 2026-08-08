import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const steps = [
  {title: 'Chọn vật liệu', image: ASSETS.products.braceletGreen, delay: -8},
  {title: 'Phối chi tiết', image: ASSETS.products.keychainsBlue, delay: 28},
  {
    title: 'Hoàn thiện & đóng gói',
    image: ASSETS.products.necklaceFlowers,
    delay: 64,
  },
] as const;

export const VerticalHandmadeScene = () => {
  const frame = useCurrentFrame();
  const pathProgress = enter(frame, 0, 122);

  return (
    <VerticalSceneShell durationInFrames={174} accent="#b9794b">
      <AbsoluteFill
        style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}
      >
        <h1
          style={{
            fontFamily: THEME.fonts.heading,
            fontSize: 72,
            lineHeight: 1.2,
            color: THEME.colors.cream,
            margin: '0 0 30px',
          }}
        >
          Chăm chút từng bước
        </h1>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            width: '100%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 46,
              top: 145,
              bottom: 145,
              width: 6,
              borderRadius: 6,
              backgroundColor: THEME.colors.backgroundRaised,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 6,
                backgroundColor: THEME.colors.yellow,
                transform: `scaleY(${pathProgress})`,
                transformOrigin: 'top center',
              }}
            />
          </div>
          {steps.map((step, index) => {
            const opacity = enter(frame, step.delay, 20);
            const y = interpolate(
              frame,
              [step.delay, step.delay + 20],
              [36, 0],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.back(1.2)),
              },
            );

            return (
              <div
                key={step.title}
                style={{
                  position: 'relative',
                  height: 300,
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 30,
                  padding: '30px 32px 30px 82px',
                  borderRadius: 28,
                  border: `2px solid ${
                    index === 2 ? THEME.colors.yellow : THEME.colors.kraft
                  }`,
                  backgroundColor: THEME.colors.backgroundRaised,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 27,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    backgroundColor: THEME.colors.brand,
                    color: THEME.colors.cream,
                    fontFamily: THEME.fonts.heading,
                    fontSize: 24,
                  }}
                >
                  {index + 1}
                </div>
                <Img
                  src={staticFile(step.image)}
                  style={{
                    width: 220, height: 220,
                    borderRadius: 20,
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                    fontFamily: THEME.fonts.heading,
                    fontSize: 42,
                    lineHeight: 1.12,
                    color: THEME.colors.yellow,
                    overflowWrap: 'break-word',
                  }}
                >
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
