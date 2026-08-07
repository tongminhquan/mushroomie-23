import {AbsoluteFill, interpolate, useCurrentFrame, Easing, Img, staticFile} from 'remotion';
import {THEME} from '../content/theme';
import {ASSETS} from '../lib/assets';
import {SceneShell} from '../components/SceneShell';
import {enter} from '../lib/motion';
import {MobileFrame} from '../components/MobileFrame';

export const ShoppingFlowScene = () => {
  const frame = useCurrentFrame();
  const steps = [
    {label: 'Xem sản phẩm', icon: '📱'},
    {label: 'Thêm vào giỏ', icon: '🛒'},
    {label: 'Đặt hàng', icon: '📦'},
  ];
  const mobileOpacity = enter(frame, 104, 20);
  const mobileY = interpolate(frame, [104, 124], [38, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.2)),
  });

  return (
    <SceneShell durationInFrames={240} accent="#ffe7a3">
      <AbsoluteFill style={{boxSizing: 'border-box'}}>
        <div
          style={{
            position: 'absolute',
            top: 220,
            left: 100,
            right: 340,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
          }}
        >
          {steps.map((step, index) => {
            const delay = index * 18 - 8;
            const stepOpacity = enter(frame, delay, 16);
            const stepY = interpolate(frame, [delay, delay + 16], [24, 0], {
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.quad),
            });

            return (
              <div key={step.label} style={{display: 'flex', alignItems: 'center', gap: 40}}>
                <div
                  style={{
                    width: 300,
                    height: 300,
                    boxSizing: 'border-box',
                    backgroundColor: THEME.colors.backgroundRaised,
                    borderRadius: THEME.radii.card,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                    opacity: stepOpacity,
                    transform: `translateY(${stepY}px)`,
                    border: `2px solid ${index === 0 ? THEME.colors.brand : 'transparent'}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 80,
                      marginBottom: 18,
                      lineHeight: 1,
                    }}
                  >
                    {step.icon}
                  </div>
                  <h3
                    style={{
                      fontFamily: THEME.fonts.heading,
                      fontSize: 32,
                      color: THEME.colors.cream,
                      margin: 0,
                      textAlign: 'center',
                      lineHeight: 1.16,
                    }}
                  >
                    {step.label}
                  </h3>
                </div>
                {index < steps.length - 1 && (
                  <div
                    style={{
                      opacity: enter(frame, delay + 10, 10),
                      color: THEME.colors.brand,
                      fontSize: 48,
                      fontFamily: THEME.fonts.heading,
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            top: 24,
            right: THEME.safe.x,
            opacity: mobileOpacity,
            transform: `translateY(${mobileY}px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              color: THEME.colors.yellow,
              fontFamily: THEME.fonts.body,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Mọi thiết bị
          </div>
          <MobileFrame src={ASSETS.screenshots.homeMobile} style={{width: 300}} />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
