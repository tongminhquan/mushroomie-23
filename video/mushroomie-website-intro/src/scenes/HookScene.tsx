import {AbsoluteFill, interpolate, useCurrentFrame, Easing, Img, staticFile} from 'remotion';
import {THEME} from '../content/theme';
import {ASSETS} from '../lib/assets';
import {SceneShell} from '../components/SceneShell';
import {enter} from '../lib/motion';
import {seededUnit} from '../lib/seed';

export const HookScene = () => {
  const frame = useCurrentFrame();

  const logoScale = interpolate(frame, [0, 14], [0.62, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });

  const t1Opacity = enter(frame, 26, 12);
  const t2Opacity = enter(frame, 62, 12);

  const t1Y = interpolate(frame, [26, 40], [20, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const t2Y = interpolate(frame, [62, 76], [20, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});

  return (
    <SceneShell durationInFrames={120} accent="#e41d1d">
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        {/* Orbits */}
        {[...Array(6)].map((_, i) => {
          const size = 20 + seededUnit(i) * 30;
          const radius = 200 + seededUnit(i + 10) * 300;
          const angleOffset = seededUnit(i + 20) * Math.PI * 2;
          const speed = (seededUnit(i + 30) - 0.5) * 0.02;
          const currentAngle = angleOffset + frame * speed;
          
          const x = Math.cos(currentAngle) * radius;
          const y = Math.sin(currentAngle) * radius;
          
          const orbitScale = enter(frame, -8 + i * 4, 20);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? THEME.colors.brand : THEME.colors.yellow,
                transform: `translate(${x}px, ${y}px) scale(${orbitScale})`,
                opacity: 0.6,
              }}
            />
          );
        })}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}>
          <Img 
            src={staticFile(ASSETS.brand.logo)} 
            style={{
              width: 160,
              height: 160,
              transform: `scale(${logoScale})`,
              marginBottom: 40
            }} 
          />
          <h1 style={{
            fontFamily: THEME.fonts.heading,
              fontSize: 78,
            color: THEME.colors.cream,
            margin: 0,
            opacity: t1Opacity,
            transform: `translateY(${t1Y}px)`,
          }}>
            Một món phụ kiện
          </h1>
          <h1 style={{
            fontFamily: THEME.fonts.heading,
              fontSize: 104,
            color: THEME.colors.brand,
            margin: 0,
            opacity: t2Opacity,
            transform: `translateY(${t2Y}px)`,
          }}>
            Một câu chuyện riêng
          </h1>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
