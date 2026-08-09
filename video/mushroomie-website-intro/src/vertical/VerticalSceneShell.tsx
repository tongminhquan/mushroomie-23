import type {ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {sceneOpacity} from '../lib/motion';
import {VERTICAL_THEME} from './vertical-theme';

export const VerticalSceneShell = ({
  accent,
  children,
  durationInFrames,
}: {
  accent: string;
  children: ReactNode;
  durationInFrames: number;
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        boxSizing: 'border-box',
        opacity: sceneOpacity(frame, durationInFrames),
        padding: `${VERTICAL_THEME.safe.top}px ${VERTICAL_THEME.safe.right}px ${VERTICAL_THEME.safe.bottom}px ${VERTICAL_THEME.safe.left}px`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 46% 42%, ${accent}38 0%, transparent 66%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
