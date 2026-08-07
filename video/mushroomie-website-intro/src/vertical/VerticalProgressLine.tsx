import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {VERTICAL_VIDEO_CONFIG} from '../config';
import {THEME} from '../content/theme';
import {VERTICAL_THEME} from './vertical-theme';

export const VerticalProgressLine = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [0, VERTICAL_VIDEO_CONFIG.durationInFrames - 1],
    [0, 1],
    {extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: VERTICAL_THEME.progress.top,
          left: VERTICAL_THEME.safe.left,
          right: VERTICAL_THEME.safe.right,
          height: VERTICAL_THEME.progress.height,
          background: `linear-gradient(90deg, ${THEME.colors.brand}, ${THEME.colors.pink}, ${THEME.colors.yellow})`,
          transform: `scaleX(${progress})`,
          transformOrigin: 'left center',
        }}
      />
    </AbsoluteFill>
  );
};
