import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {ProductCard} from '../../components/ProductCard';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const products = [
  {image: ASSETS.products.braceletGreen, name: 'Vòng tay xanh', category: 'Vòng tay'},
  {image: ASSETS.products.braceletPink, name: 'Vòng tay hồng', category: 'Vòng tay'},
  {image: ASSETS.products.keychainsPastel, name: 'Móc khóa pastel', category: 'Móc khóa'},
] as const;

export const VerticalProductsScene = () => {
  const frame = useCurrentFrame();
  const cardMotion = (delay: number) => ({
    opacity: enter(frame, delay, 20),
    transform: `translateY(${interpolate(frame, [delay, delay + 20], [28, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2))})}px)`,
  });

  return (
    <VerticalSceneShell durationInFrames={150} accent="#ffe7a3">
      <AbsoluteFill>
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 72, lineHeight: 1.08, color: THEME.colors.cream, textAlign: 'center', width: '100%', maxWidth: 760, minHeight: 172, margin: '0 auto', opacity: enter(frame, -12, 18)}}>
          Tìm món phụ kiện hợp gu
        </h1>
        <div style={{position: 'absolute', top: 200, left: 264, ...cardMotion(-8)}}>
          <ProductCard {...products[0]} style={{width: 300, height: 500}} />
        </div>
        <div style={{position: 'absolute', top: 742, left: 0, ...cardMotion(4)}}>
          <ProductCard {...products[1]} style={{width: 230, height: 440}} />
        </div>
        <div style={{position: 'absolute', top: 742, right: 0, ...cardMotion(16)}}>
          <ProductCard {...products[2]} style={{width: 230, height: 440}} />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
