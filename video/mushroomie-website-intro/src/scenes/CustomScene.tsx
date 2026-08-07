import {AbsoluteFill, interpolate, interpolateColors, useCurrentFrame, Easing} from 'remotion';
import {THEME} from '../content/theme';
import {ASSETS} from '../lib/assets';
import {SceneShell} from '../components/SceneShell';
import {ProductCard} from '../components/ProductCard';
import {enter} from '../lib/motion';

export const CustomScene = () => {
  const frame = useCurrentFrame();
  const labelOpacity = enter(frame, -10, 18);
  const chips = [
    {name: 'Màu sắc', at: -6},
    {name: 'Hạt', at: 36},
    {name: 'Charm', at: 78},
  ];
  const productOpacity = enter(frame, 84, 20);
  const productScale = interpolate(frame, [84, 104], [1, 1.08], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.25)),
  });
  const titleOpacity = enter(frame, 124, 16);
  const titleY = interpolate(frame, [124, 140], [18, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <SceneShell durationInFrames={270} accent="#e41d1d">
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          padding: '70px 120px 180px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 54,
            color: THEME.colors.yellow,
            fontFamily: THEME.fonts.body,
            fontSize: 22,
            opacity: labelOpacity,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Minh họa quy trình cá nhân hóa
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 110,
            width: '100%',
            transform: 'translateY(-12px)',
          }}
        >
          <div style={{width: 520, display: 'flex', flexDirection: 'column', gap: 34}}>
            <h1
              style={{
                fontFamily: THEME.fonts.heading,
                fontSize: 70,
                lineHeight: 1.12,
                color: THEME.colors.cream,
                margin: 0,
                opacity: titleOpacity,
                transform: `translateY(${titleY}px)`,
              }}
            >
              Dấu ấn
              <br />
              của riêng bạn
            </h1>

            <div style={{display: 'flex', flexWrap: 'wrap', gap: 18}}>
              {chips.map((chip) => {
                const chipOpacity = enter(frame, chip.at, 14);
                const chipY = interpolate(frame, [chip.at, chip.at + 14], [18, 0], {
                  extrapolateRight: 'clamp',
                  easing: Easing.out(Easing.quad),
                });
                const chipActive = enter(frame, chip.at + 10, 10);

                return (
                  <div
                    key={chip.name}
                    style={{
                      padding: '14px 26px',
                      backgroundColor: interpolateColors(
                        chipActive,
                        [0, 1],
                        [THEME.colors.backgroundRaised, THEME.colors.brand],
                      ),
                      color: interpolateColors(
                        chipActive,
                        [0, 1],
                        ['#b9c0c4', THEME.colors.cream],
                      ),
                      borderRadius: 100,
                      fontFamily: THEME.fonts.body,
                      fontSize: 25,
                      fontWeight: 700,
                      opacity: chipOpacity,
                      transform: `translateY(${chipY}px)`,
                    }}
                  >
                    {chip.name}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              opacity: productOpacity,
              transform: `scale(${productScale})`,
            }}
          >
            <ProductCard
              image={ASSETS.products.braceletBlue}
              name="Vòng tay Custom"
              category="Cá nhân hóa"
            />
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
