import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {ProductCard} from '../../components/ProductCard';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const products = [
  {image: ASSETS.products.braceletGreen, name: 'VÃ²ng tay xanh', category: 'VÃ²ng tay'},
  {image: ASSETS.products.braceletPink, name: 'VÃ²ng tay há»“ng', category: 'VÃ²ng tay'},
  {image: ASSETS.products.keychainsPastel, name: 'MÃ³c khÃ³a pastel', category: 'MÃ³c khÃ³a'},
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
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 72, color: THEME.colors.cream, textAlign: 'center', margin: 0, opacity: enter(frame, -12, 18)}}>
          TÃ¬m mÃ³n phá»¥ kiá»‡n há»£p gu
        </h1>
        <div style={{position: 'absolute', top: 120, left: 219, ...cardMotion(-8)}}>
          <ProductCard {...products[0]} style={{width: 390, height: 600}} />
        </div>
        <div style={{position: 'absolute', top: 730, left: 8, ...cardMotion(4)}}>
          <ProductCard {...products[1]} style={{width: 300, height: 480}} />
        </div>
        <div style={{position: 'absolute', top: 730, right: 8, ...cardMotion(16)}}>
          <ProductCard {...products[2]} style={{width: 300, height: 480}} />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
