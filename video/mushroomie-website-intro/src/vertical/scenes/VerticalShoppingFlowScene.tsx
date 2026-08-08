import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MobileFrame} from '../../components/MobileFrame';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const steps = [
  {label: 'Xem sản phẩm', icon: '📱'},
  {label: 'Thêm vào giỏ', icon: '🛒'},
  {label: 'Đặt hàng', icon: '📦'},
] as const;

export const VerticalShoppingFlowScene = () => {
  const frame = useCurrentFrame();
  const mobileOpacity = enter(frame, 104, 20);
  const mobileY = interpolate(frame, [104, 124], [38, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.2)),
  });

  return (
    <VerticalSceneShell durationInFrames={147} accent="#ffe7a3">
      <AbsoluteFill>
        <h1
          style={{
            fontFamily: THEME.fonts.heading,
            fontSize: 70,
            color: THEME.colors.cream,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Mua sắm dễ dàng
        </h1>
        <div
          style={{
            position: 'absolute',
            top: 280,
            left: 0,
            width: 300,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {steps.map((step, index) => {
            const delay = index * 18 - 8;
            const y = interpolate(frame, [delay, delay + 16], [24, 0], {
              extrapolateRight: 'clamp',
            });

            return (
              <div
                key={step.label}
                style={{
                  width: 300,
                  height: 190,
                  boxSizing: 'border-box',
                  padding: 22,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  borderRadius: 26,
                  border: `2px solid ${index === 0 ? THEME.colors.brand : 'transparent'}`,
                  backgroundColor: THEME.colors.backgroundRaised,
                  opacity: enter(frame, delay, 16),
                  transform: `translateY(${y}px)`,
                }}
              >
                <div style={{fontSize: 54}}>{step.icon}</div>
                <div
                  style={{
                    fontFamily: THEME.fonts.heading,
                    fontSize: 30,
                    lineHeight: 1.1,
                    color: THEME.colors.cream,
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 150,
            right: 0,
            width: 440,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            opacity: mobileOpacity,
            transform: `translateY(${mobileY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: THEME.fonts.body,
              fontSize: 25,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: THEME.colors.yellow,
            }}
          >
            Mọi thiết bị
          </div>
          <MobileFrame src={ASSETS.screenshots.homeMobile} style={{width: 440}} />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
