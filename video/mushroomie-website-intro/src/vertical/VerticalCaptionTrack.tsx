import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SCENES} from '../content/scenes';
import {THEME} from '../content/theme';
import {VERTICAL_VIDEO_CONFIG} from '../config';
import {activeCaptionAt, splitEmphasis} from '../lib/captions';
import {
  VERTICAL_THEME,
  verticalCaptionFontSize,
} from './vertical-theme';

export const VerticalCaptionTrack = () => {
  const frame = useCurrentFrame();
  const milliseconds = (frame / VERTICAL_VIDEO_CONFIG.fps) * 1000;
  const caption = activeCaptionAt(milliseconds);
  const scene = SCENES.find(({from, to}) => frame >= from && frame <= to);

  if (!caption) return null;

  const startFrame = Math.floor(
    (caption.startMs / 1000) * VERTICAL_VIDEO_CONFIG.fps,
  );
  const endFrame = Math.floor(
    (caption.endMs / 1000) * VERTICAL_VIDEO_CONFIG.fps,
  );
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 5, endFrame - 5, endFrame],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const fragments = splitEmphasis(caption.text, scene?.emphasis ?? []);

  return (
    <AbsoluteFill
      style={{
        boxSizing: 'border-box',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        paddingLeft: VERTICAL_THEME.safe.left,
        paddingRight: VERTICAL_THEME.safe.right,
        paddingBottom: VERTICAL_THEME.caption.bottom,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: VERTICAL_THEME.caption.maxWidth,
          maxHeight: VERTICAL_THEME.caption.maxHeight,
          display: 'block',
          overflow: 'hidden',
          padding: '10px 18px',
          borderRadius: 22,
          backgroundColor: 'rgba(7, 16, 20, 0.82)',
          color: THEME.colors.cream,
          fontFamily: THEME.fonts.body,
          fontSize: verticalCaptionFontSize(caption.text),
          fontWeight: 700,
          lineHeight: VERTICAL_THEME.caption.lineHeight,
          textAlign: 'left',
          textShadow: '0 4px 12px rgba(0,0,0,0.5)',
          opacity,
        }}
      >
        {fragments.map((fragment, index) => (
          <span
            key={`${fragment.text}-${index}`}
            style={{
              color: fragment.highlighted
                ? THEME.colors.brand
                : THEME.colors.cream,
            }}
          >
            {fragment.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
