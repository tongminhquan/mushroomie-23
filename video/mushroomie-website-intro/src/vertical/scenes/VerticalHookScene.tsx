import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {seededUnit} from '../../lib/seed';
import {VerticalSceneShell} from '../VerticalSceneShell';

export const VerticalHookScene = () => {
  const frame = useCurrentFrame();
  const logoScale = interpolate(frame, [0, 14], [0.62, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });
  const firstOpacity = enter(frame, 26, 12);
  const secondOpacity = enter(frame, 62, 12);
  const firstY = interpolate(frame, [26, 40], [24, 0], {extrapolateRight: 'clamp'});
  const secondY = interpolate(frame, [62, 76], [24, 0], {extrapolateRight: 'clamp'});

  return (
    <VerticalSceneShell durationInFrames={120} accent="#e41d1d">
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        {Array.from({length: 6}, (_, index) => {
          const size = 18 + seededUnit(index) * 26;
          const radius = 150 + seededUnit(index + 10) * 230;
          const angle = seededUnit(index + 20) * Math.PI * 2 + frame * ((seededUnit(index + 30) - 0.5) * 0.018);
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: index % 2 === 0 ? THEME.colors.brand : THEME.colors.yellow,
                opacity: 0.55,
                transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(${enter(frame, -8 + index * 4, 20)})`,
              }}
            />
          );
        })}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center'}}>
          <Img src={staticFile(ASSETS.brand.logo)} style={{width: 190, height: 190, marginBottom: 44, transform: `scale(${logoScale})`}} />
          <div style={{fontFamily: THEME.fonts.heading, fontSize: 82, lineHeight: 1.08, color: THEME.colors.cream, opacity: firstOpacity, transform: `translateY(${firstY}px)`}}>
            Má»™t mÃ³n phá»¥ kiá»‡n
          </div>
          <div style={{fontFamily: THEME.fonts.heading, fontSize: 104, lineHeight: 1.02, color: THEME.colors.brand, opacity: secondOpacity, transform: `translateY(${secondY}px)`}}>
            Má»™t cÃ¢u chuyá»‡n riÃªng
          </div>
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
