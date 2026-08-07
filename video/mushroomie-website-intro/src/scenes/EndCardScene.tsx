import {AbsoluteFill, interpolate, useCurrentFrame, Easing, Img, staticFile} from 'remotion';
import {THEME} from '../content/theme';
import {ASSETS} from '../lib/assets';
import {SceneShell} from '../components/SceneShell';
import {enter} from '../lib/motion';

export const EndCardScene = ({mode}: {mode: 'slogan' | 'cta'}) => {
  const frame = useCurrentFrame();

  if (mode === 'slogan') {
    const logoScale = interpolate(frame, [0, 20], [0.88, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5))});
    const logoOpacity = enter(frame, -10, 20);

    const text1Opacity = enter(frame, 40, 15);
    const text2Opacity = enter(frame, 70, 15);
    
    return (
      <SceneShell durationInFrames={117} accent="#ffe7a3">
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: 60}}>
          <Img 
            src={staticFile(ASSETS.brand.logo)} 
            style={{
              width: 240, 
              height: 240,
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
              filter: `drop-shadow(0 0 40px ${THEME.colors.yellow}44)`
            }} 
          />
           <div style={{display: 'flex', gap: 20, fontFamily: THEME.fonts.heading, fontSize: 86, color: THEME.colors.cream}}>
             <span style={{opacity: text1Opacity}}>Làm bằng tay,</span>
             <span style={{opacity: text2Opacity, color: THEME.colors.brand}}>trao bằng tim</span>
          </div>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // mode === 'cta'
  const settleProgress = enter(frame, 10, 60); // settles by 70
  
  const logoScale = interpolate(settleProgress, [0, 1], [1.2, 1]);
  const logoY = interpolate(settleProgress, [0, 1], [-50, -100]);

  const domainOpacity = enter(frame, 10, 16);
  const domainY = interpolate(frame, [10, 26], [20, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});

  const btnOpacity = enter(frame, 20, 16);
  const btnScale = interpolate(frame, [20, 36], [0.9, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5))});

  return (
    <SceneShell durationInFrames={84} accent="#e41d1d">
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column'}}>
        <Img 
          src={staticFile(ASSETS.brand.logo)} 
          style={{
             width: 200, 
             height: 200,
            transform: `translateY(${logoY}px) scale(${logoScale})`,
          }} 
        />
        
        <div style={{
          fontFamily: THEME.fonts.heading,
           fontSize: 70,
          color: THEME.colors.cream,
          opacity: domainOpacity,
          transform: `translateY(${domainY}px)`,
          marginBottom: 60,
          marginTop: -40
        }}>
          mushroomie.io.vn
        </div>

        <div style={{
          backgroundColor: THEME.colors.brand,
          padding: '26px 70px',
          borderRadius: 100,
          fontFamily: THEME.fonts.heading,
          fontSize: 52,
          color: THEME.colors.cream,
          opacity: btnOpacity,
          transform: `scale(${btnScale})`,
          boxShadow: `0 20px 40px ${THEME.colors.brand}66`
        }}>
          Khám phá ngay
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
