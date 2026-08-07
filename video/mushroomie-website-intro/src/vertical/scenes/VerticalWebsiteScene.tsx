import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BrowserFrame} from '../../components/BrowserFrame';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

export const VerticalWebsiteScene = () => {
  const frame = useCurrentFrame();
  const titleOpacity = enter(frame, -10, 18);
  const browserOpacity = enter(frame, -8, 20);
  const zoom = interpolate(frame, [0, 144], [0.96, 1], {extrapolateRight: 'clamp'});
  const chips = ['Vòng tay', 'Charm', 'Móc khóa', 'Phụ kiện'];

  return (
    <VerticalSceneShell durationInFrames={144} accent="#ffd6d6">
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 72, lineHeight: 1.08, color: THEME.colors.cream, textAlign: 'center', width: '100%', maxWidth: 760, margin: '0 0 28px', opacity: titleOpacity}}>
          Không gian handmade của riêng bạn
        </h1>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginBottom: 34}}>
          {chips.map((chip, index) => (
            <div key={chip} style={{padding: '12px 20px', borderRadius: 100, backgroundColor: THEME.colors.brand, color: THEME.colors.cream, fontFamily: THEME.fonts.body, fontSize: 28, fontWeight: 700, opacity: enter(frame, 4 + index * 8, 12)}}>
              {chip}
            </div>
          ))}
        </div>
        <div style={{width: '100%', height: 720, overflow: 'hidden', borderRadius: 28, opacity: browserOpacity, transform: `scale(${zoom})`}}>
          <BrowserFrame src={ASSETS.screenshots.homeDesktop} style={{width: '100%'}} />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
