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
      <div style={{
         position: 'absolute',
         top: 10,
         left: '50%',
         transform: 'translateX(-50%)',
         width: 80,
         height: 20,
         backgroundColor: '#111519',
         borderRadius: 12,
         zIndex: 10
      }} />
      <Img src={staticFile(src)} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  );
};
