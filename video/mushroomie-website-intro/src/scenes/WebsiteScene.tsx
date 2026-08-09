import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {THEME} from '../content/theme';
import {ASSETS} from '../lib/assets';
import {SceneShell} from '../components/SceneShell';
import {BrowserFrame} from '../components/BrowserFrame';
import {enter} from '../lib/motion';

export const WebsiteScene = () => {
  const frame = useCurrentFrame();
  const captionReserve =
    THEME.caption.bottom +
    THEME.caption.maxHeight +
    THEME.caption.clearance;

  const titleOpacity = enter(frame, -10, 18);
  const titleY = interpolate(frame, [-10, 8], [20, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});

  const chips = ['Vòng tay', 'Charm', 'Móc khóa', 'Phụ kiện'];

  const zoom = interpolate(frame, [0, 144], [0.96, 1], {extrapolateRight: 'clamp'});
  const browserOpacity = enter(frame, -8, 20);
  const browserY = interpolate(frame, [-8, 12], [32, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});

  return (
    <SceneShell durationInFrames={144} accent="#ffd6d6">
      <AbsoluteFill style={{
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
        padding: `${THEME.safe.y}px ${THEME.safe.x}px ${captionReserve}px`,
      }}>
        {/* Left 38% */}
        <div style={{flex: 0.38, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: 48}}>
          <h1 style={{
            fontFamily: THEME.fonts.heading,
            fontSize: 62,
            color: THEME.colors.cream,
            margin: 0,
            marginBottom: 40,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1.2
          }}>
            Không gian handmade của riêng bạn
          </h1>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
            {chips.map((chip, i) => {
            const chipStart = 4 + i * 8;
            const chipOpacity = enter(frame, chipStart, 12);
            const chipY = interpolate(frame, [chipStart, chipStart + 12], [15, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
              return (
                <div key={chip} style={{
                  padding: '12px 24px',
                  backgroundColor: THEME.colors.brand,
                  borderRadius: 100,
                  color: THEME.colors.cream,
                  fontFamily: THEME.fonts.body,
                  fontSize: 24,
                  fontWeight: 600,
                  opacity: chipOpacity,
                  transform: `translateY(${chipY}px)`
                }}>
                  {chip}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 62% */}
        <div style={{flex: 0.62, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{
            width: '100%',
            maxWidth: 1040,
            height: 650,
            overflow: 'hidden',
            borderRadius: 28,
            opacity: browserOpacity,
            transform: `translateY(${browserY - 26}px) scale(${zoom})`,
          }}>
            <BrowserFrame src={ASSETS.screenshots.homeDesktop} style={{width: '100%', maxWidth: 1040}} />
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
