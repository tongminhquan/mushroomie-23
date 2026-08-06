import React from 'react';
import { BrowserFrame } from './BrowserFrame';
import { THEME } from '../content/theme';

interface FeatureTileProps {
  icon: string;
  title: string;
  subtitle: string;
  screenshot?: string;
  style?: React.CSSProperties;
}

export const FeatureTile: React.FC<FeatureTileProps> = ({ icon, title, subtitle, screenshot, style }) => {
  return (
    <div style={{
      backgroundColor: 'rgba(12, 21, 25, 0.85)',
      borderRadius: THEME.radii.card,
      boxSizing: 'border-box',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      ...style
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{fontSize: 38}}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{fontFamily: THEME.fonts.heading, fontSize: 23, color: THEME.colors.cream, lineHeight: 1.14}}>{title}</span>
          <span style={{fontFamily: THEME.fonts.body, fontSize: 16, color: THEME.colors.cream, opacity: 0.7}}>{subtitle}</span>
        </div>
      </div>
      {screenshot && (
        <div style={{ flex: 1, overflow: 'hidden', borderRadius: THEME.radii.small, backgroundColor: '#1a1f25', position: 'relative' }}>
          <div style={{ width: '200%', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
            <BrowserFrame src={screenshot} />
          </div>
        </div>
      )}
    </div>
  );
};
