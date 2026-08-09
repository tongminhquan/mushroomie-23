import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {THEME} from '../content/theme';
import { VIDEO_CONFIG } from '../config';

export const ProgressLine: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [0, VIDEO_CONFIG.durationInFrames - 1],
    [0, 1],
    {extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: THEME.safe.y,
          left: 0,
          height: 5,
          width: '100%',
          background: `linear-gradient(90deg, ${THEME.colors.brand}, ${THEME.colors.pink}, ${THEME.colors.yellow})`,
          transform: `scaleX(${progress})`,
          transformOrigin: 'left center',
        }}
      />
    </AbsoluteFill>
  );
};
