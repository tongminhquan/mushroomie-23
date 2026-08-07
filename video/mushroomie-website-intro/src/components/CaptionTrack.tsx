import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { THEME } from '../content/theme';
import { SCENES } from '../content/scenes';
import { VIDEO_CONFIG } from '../config';
import { activeCaptionAt, splitEmphasis } from '../lib/captions';

export const CaptionTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const ms = (frame / VIDEO_CONFIG.fps) * 1000;
  
  const currentCaption = activeCaptionAt(ms);
  const currentScene = SCENES.find(s => frame >= s.from && frame <= s.to);
  const emphasisArray = currentScene?.emphasis || [];

  if (!currentCaption) {
    return null;
  }

  // Calculate local frame within caption duration for opacity
  const startFrame = Math.floor((currentCaption.startMs / 1000) * VIDEO_CONFIG.fps);
  const endFrame = Math.floor((currentCaption.endMs / 1000) * VIDEO_CONFIG.fps);
  
  // Smooth fade in/out for caption
  const opacity = interpolate(frame, [startFrame, startFrame + 5, endFrame - 5, endFrame], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  const fragments = splitEmphasis(currentCaption.text, emphasisArray);

  return (
    <AbsoluteFill style={{ 
      justifyContent: 'flex-end', 
      alignItems: 'center', 
      paddingBottom: THEME.caption.bottom,
      pointerEvents: 'none'
    }}>
      <div style={{
        fontFamily: THEME.fonts.body,
        fontWeight: 700,
        fontSize: 38,
        color: 'white',
        textAlign: 'center',
        maxWidth: 1300,
        maxHeight: THEME.caption.maxHeight,
        overflow: 'hidden',
        lineHeight: 1.35,
        backgroundColor: 'rgba(7, 16, 20, 0.72)',
        borderRadius: 20,
        padding: '10px 24px',
        boxSizing: 'border-box',
        textShadow: '0 4px 12px rgba(0,0,0,0.5)',
        opacity
      }}>
        {fragments.map((fragment, i) => (
          <span key={i} style={{ color: fragment.highlighted ? THEME.colors.brand : 'white' }}>
            {fragment.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
