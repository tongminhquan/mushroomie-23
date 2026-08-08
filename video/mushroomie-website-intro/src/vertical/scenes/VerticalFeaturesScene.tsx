import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BrowserFrame} from '../../components/BrowserFrame';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const FEATURE_CARD_HEIGHT = 500;
const FEATURE_PREVIEW_WIDTH = 140;

const features = [
  {
    title: 'Câu chuyện thương hiệu',
    subtitle: 'Khám phá hành trình',
    icon: '📖',
    screenshot: ASSETS.screenshots.homeDesktop,
    delay: -4,
  },
  {
    title: 'Bài viết mới',
    subtitle: 'Góc chia sẻ',
    icon: '📰',
    screenshot: ASSETS.screenshots.newsDesktop,
    delay: 10,
  },
  {
    title: 'Voucher dành riêng',
    subtitle: 'Ưu đãi hấp dẫn',
    icon: '🎫',
    screenshot: ASSETS.screenshots.productsDesktop,
    delay: 24,
  },
  {
    title: 'Mini game thú vị',
    subtitle: 'Chơi và nhận quà',
    icon: '🎮',
    screenshot: ASSETS.screenshots.miniGameDesktop,
    delay: 38,
  },
] as const;

export const VerticalFeaturesScene = () => {
  const frame = useCurrentFrame();

  return (
    <VerticalSceneShell durationInFrames={177} accent="#ffd6d6">
      <AbsoluteFill
        style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}
      >
        <h1
          style={{
            fontFamily: THEME.fonts.heading,
            fontSize: 70,
            lineHeight: 1.08,
            textAlign: 'center',
            color: THEME.colors.cream,
            margin: '0 0 34px',
            opacity: enter(frame, -10, 16),
          }}
        >
          Nhiều tính năng hấp dẫn
        </h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
            width: '100%',
          }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              style={{
                minWidth: 0,
                height: FEATURE_CARD_HEIGHT,
                boxSizing: 'border-box',
                padding: 20,
                borderRadius: 28,
                backgroundColor: 'rgba(12,21,25,.88)',
                opacity: enter(frame, feature.delay, 18),
                transform: `scale(${interpolate(
                  frame,
                  [feature.delay, feature.delay + 18],
                  [0.94, 1],
                  {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  },
                )})`,
              }}
            >
              <div style={{height: 54, fontSize: 54, lineHeight: 1}}>
                {feature.icon}
              </div>
              <div
                style={{
                  height: 64,
                  display: 'flex',
                  alignItems: 'flex-end',
                  fontFamily: THEME.fonts.heading,
                  fontSize: 29,
                  lineHeight: 1.1,
                  color: THEME.colors.cream,
                  margin: '12px 0 6px',
                }}
              >
                {feature.title}
              </div>
              <div
                style={{
                  height: 27,
                  fontFamily: THEME.fonts.body,
                  fontSize: 22,
                  lineHeight: 1.2,
                  color: THEME.colors.cream,
                  opacity: 0.72,
                  marginBottom: 16,
                }}
              >
                {feature.subtitle}
              </div>
              <div style={{display: 'flex', justifyContent: 'center'}}>
                <BrowserFrame
                  src={feature.screenshot}
                  style={{width: FEATURE_PREVIEW_WIDTH}}
                />
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
