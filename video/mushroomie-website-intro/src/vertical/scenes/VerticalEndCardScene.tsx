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

export const VerticalEndCardScene = ({mode}: {mode: 'slogan' | 'cta'}) => {
  const frame = useCurrentFrame();

  if (mode === 'slogan') {
    const logoScale = interpolate(frame, [0, 20], [0.88, 1], {
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.5)),
    });
    const text1Opacity = enter(frame, 40, 15);
    const text2Opacity = enter(frame, 70, 15);

    return (
      <VerticalSceneShell durationInFrames={117} accent="#ffe7a3">
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 54,
            textAlign: 'center',
          }}
        >
          <Img
            src={staticFile(ASSETS.brand.logo)}
            style={{width: 220, height: 220, transform: `scale(${logoScale})`}}
          />
          <div
            style={{
              fontFamily: THEME.fonts.heading,
              fontSize: 82,
              lineHeight: 1.08,
              color: THEME.colors.cream,
            }}
          >
            <div style={{opacity: text1Opacity}}>Làm bằng tay,</div>
            <div
              style={{
                marginTop: 18,
                color: THEME.colors.brand,
                opacity: text2Opacity,
              }}
            >
              trao bằng tim
            </div>
          </div>
        </AbsoluteFill>
      </VerticalSceneShell>
    );
  }

  const settleProgress = enter(frame, 10, 60);
  const logoScale = interpolate(settleProgress, [0, 1], [1.18, 1]);
  const logoY = interpolate(settleProgress, [0, 1], [-36, -70]);
  const domainOpacity = enter(frame, 10, 16);
  const buttonOpacity = enter(frame, 20, 16);

  return (
    <VerticalSceneShell durationInFrames={84} accent="#e41d1d">
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Img
          src={staticFile(ASSETS.brand.logo)}
          style={{
            width: 190,
            height: 190,
            transform: `translateY(${logoY}px) scale(${logoScale})`,
          }}
        />
        <div
          style={{
            fontFamily: THEME.fonts.heading,
            fontSize: 56,
            lineHeight: 1.1,
            color: THEME.colors.cream,
            margin: '10px 0 54px',
            opacity: domainOpacity,
          }}
        >
          mushroomie.io.vn
        </div>
        <div
          style={{
            padding: '24px 58px',
            borderRadius: 100,
            backgroundColor: THEME.colors.brand,
            color: THEME.colors.cream,
            fontFamily: THEME.fonts.heading,
            fontSize: 48,
            boxShadow: `0 20px 40px ${THEME.colors.brand}66`,
            opacity: buttonOpacity,
          }}
        >
          Khám phá ngay
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
