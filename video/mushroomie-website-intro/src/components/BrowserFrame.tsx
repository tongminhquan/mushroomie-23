import React from 'react';
import { Img, staticFile } from 'remotion';

interface BrowserFrameProps {
  src: string;
  style?: React.CSSProperties;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({ src, style }) => {
  return (
    <div style={{
      backgroundColor: '#1a1f25',
      borderRadius: 28,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      ...style
    }}>
      <div style={{
        height: 32,
        backgroundColor: '#111519',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27c93f' }} />
      </div>
      <Img src={staticFile(src)} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  );
};
