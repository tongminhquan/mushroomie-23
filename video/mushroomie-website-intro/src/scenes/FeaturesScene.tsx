import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {THEME} from '../content/theme';
import {ASSETS} from '../lib/assets';
import {SceneShell} from '../components/SceneShell';
import {FeatureTile} from '../components/FeatureTile';
import {enter} from '../lib/motion';

export const FeaturesScene = () => {
  const frame = useCurrentFrame();
  const titleOpacity = enter(frame, -10, 16);
  const titleY = interpolate(frame, [-10, 6], [20, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const features = [
    {title: 'Câu chuyện thương hiệu', subtitle: 'Khám phá hành trình', icon: '📖', screenshot: ASSETS.screenshots.homeDesktop, delay: -4},
    {title: 'Bài viết mới', subtitle: 'Góc chia sẻ', icon: '📰', screenshot: ASSETS.screenshots.newsDesktop, delay: 10},
    {title: 'Voucher dành riêng', subtitle: 'Ưu đãi hấp dẫn', icon: '🎫', screenshot: ASSETS.screenshots.productsDesktop, delay: 24},
    {title: 'Mini game thú vị', subtitle: 'Chơi và nhận quà', icon: '🎮', screenshot: ASSETS.screenshots.miniGameDesktop, delay: 38},
  ];

  return (
    <SceneShell durationInFrames={177} accent="#ffd6d6">
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          paddingTop: THEME.safe.y - 8,
          paddingBottom: 180,
        }}
      >
        <h1
          style={{
            fontFamily: THEME.fonts.heading,
            fontSize: 64,
            color: THEME.colors.cream,
            margin: 0,
            marginBottom: 28,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Nhiều tính năng hấp dẫn
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 28,
            width: 1320,
          }}
        >
          {features.map((feature) => {
            const featureOpacity = enter(frame, feature.delay, 18);
            const featureScale = interpolate(frame, [feature.delay, feature.delay + 18], [0.94, 1], {
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.back(1.2)),
            });

            return (
              <div
                key={feature.title}
                style={{
                  opacity: featureOpacity,
                  transform: `scale(${featureScale})`,
                }}
              >
                <FeatureTile
                  icon={feature.icon}
                  title={feature.title}
                  subtitle={feature.subtitle}
                  screenshot={feature.screenshot}
                  style={{width: '100%', height: 248}}
                />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
