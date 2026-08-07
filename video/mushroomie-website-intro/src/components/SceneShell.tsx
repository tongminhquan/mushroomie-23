import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { THEME } from '../content/theme';
import { sceneOpacity } from '../lib/motion';

interface SceneShellProps {
  durationInFrames: number;
  accent: string;
  children: React.ReactNode;
}

export const SceneShell: React.FC<SceneShellProps> = ({ durationInFrames, accent, children }) => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, durationInFrames);

  return (
    <AbsoluteFill style={{opacity, padding: THEME.safe.x}}>
      <AbsoluteFill style={{
        background: `radial-gradient(circle at center, ${accent}30 0%, transparent 70%)`,
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
      }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
