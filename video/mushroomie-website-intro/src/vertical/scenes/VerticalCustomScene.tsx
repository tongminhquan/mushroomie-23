import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {ProductCard} from '../../components/ProductCard';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

export const VerticalCustomScene = () => {
  const frame = useCurrentFrame();
  const titleY = interpolate(frame, [124, 140], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const chips = [
    {name: 'Màu sắc', at: -6},
    {name: 'Hạt', at: 36},
    {name: 'Charm', at: 78},
  ] as const;

  return (
    <VerticalSceneShell durationInFrames={177} accent="#e41d1d">
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            fontFamily: THEME.fonts.body,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: THEME.colors.yellow,
            opacity: enter(frame, -10, 18),
          }}
        >
          Minh họa quy trình cá nhân hóa
        </div>
        <h1
          style={{
            fontFamily: THEME.fonts.heading,
            fontSize: 76,
            lineHeight: 1.06,
            textAlign: 'center',
            color: THEME.colors.cream,
            margin: '36px 0 28px',
            opacity: enter(frame, 124, 16),
            transform: `translateY(${titleY}px)`,
          }}
        >
          Dấu ấn của riêng bạn
        </h1>
        <div style={{display: 'flex', gap: 16, marginBottom: 34}}>
          {chips.map((chip) => (
            <div
              key={chip.name}
              style={{
                padding: '14px 24px',
                borderRadius: 100,
                backgroundColor: THEME.colors.brand,
                color: THEME.colors.cream,
                fontFamily: THEME.fonts.body,
                fontSize: 30,
                fontWeight: 800,
                opacity: enter(frame, chip.at, 14),
              }}
            >
              {chip.name}
            </div>
          ))}
        </div>
        <div
          style={{
            opacity: enter(frame, 84, 20),
            transform: `scale(${interpolate(frame, [84, 104], [0.94, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })})`,
          }}
        >
          <ProductCard
            image={ASSETS.products.braceletBlue}
            name="Vòng tay Custom"
            category="Cá nhân hóa"
            style={{width: 480, height: 760}}
          />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
