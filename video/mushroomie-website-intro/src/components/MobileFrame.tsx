import React from 'react';
import { Img, staticFile } from 'remotion';

interface MobileFrameProps {
  src: string;
  style?: React.CSSProperties;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ src, style }) => {
  return (
    <div style={{
      backgroundColor: '#1a1f25',
      borderRadius: 40,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      border: '8px solid #111519',
      position: 'relative',
      ...style
    }}>

      <Img src={staticFile(src)} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  );
};
