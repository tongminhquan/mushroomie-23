import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {THEME} from '../content/theme';
import {ASSETS} from '../lib/assets';
import {SceneShell} from '../components/SceneShell';
import {ProductCard} from '../components/ProductCard';
import {enter} from '../lib/motion';

export const ProductsScene = () => {
  const frame = useCurrentFrame();

  const titleOpacity = enter(frame, -12, 18);
  const titleY = interpolate(frame, [-12, 6], [20, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});

  const products = [
    {image: ASSETS.products.braceletGreen, name: 'Vòng tay xanh', category: 'Vòng tay'},
    {image: ASSETS.products.braceletPink, name: 'Vòng tay hồng', category: 'Vòng tay'},
    {image: ASSETS.products.keychainsPastel, name: 'Móc khóa pastel', category: 'Móc khóa'},
  ];

  return (
    <SceneShell durationInFrames={210} accent="#ffe7a3">
      <AbsoluteFill style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        paddingTop: 12,
      }}>
        <h1 style={{
          fontFamily: THEME.fonts.heading,
          fontSize: 64,
          color: THEME.colors.cream,
          margin: 0,
          marginBottom: 42,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}>
          Tìm món phụ kiện hợp gu
        </h1>

        <div style={{
          display: 'flex',
          gap: 40,
          justifyContent: 'center',
          width: '100%',
          marginTop: 18,
        }}>
          {products.map((p, i) => {
            const delay = i * 12 - 8;
            const pOpacity = enter(frame, delay, 20);
            const pY = interpolate(frame, [delay, delay + 20], [-24, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2))});
            const pScale = interpolate(frame, [delay, delay + 20], [0.94, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2))});

            return (
              <div key={p.name} style={{
                opacity: pOpacity,
                transform: `translateY(${pY}px) scale(${pScale})`,
              }}>
                <ProductCard image={p.image} name={p.name} category={p.category} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
