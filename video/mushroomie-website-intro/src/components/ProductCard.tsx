import React from 'react';
import { Img, staticFile } from 'remotion';
import { THEME } from '../content/theme';

interface ProductCardProps {
  image: string;
  name: string;
  category: string;
  style?: React.CSSProperties;
}

export const ProductCard: React.FC<ProductCardProps> = ({ image, name, category, style }) => {
  return (
    <div style={{
      width: 330,
      height: 560,
      backgroundColor: THEME.colors.cream,
      borderRadius: THEME.radii.card,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      ...style
    }}>
      <div style={{width: '100%', aspectRatio: '3 / 4', backgroundColor: '#fff', overflow: 'hidden', flexShrink: 0}}>
        <Img src={staticFile(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{padding: '16px 20px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, flex: 1}}>
        <span style={{fontFamily: THEME.fonts.heading, fontSize: 26, color: THEME.colors.ink, lineHeight: 1.2}}>{name}</span>
        <span style={{fontFamily: THEME.fonts.body, fontSize: 17, color: THEME.colors.ink, opacity: 0.7}}>{category}</span>
      </div>
    </div>
  );
};
