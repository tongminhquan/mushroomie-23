import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { THEME } from '../content/theme';
import { seededUnit } from '../lib/seed';

export const AmbientBackground: React.FC<{ accent?: string }> = ({ accent = THEME.colors.brand }) => {
  const frame = useCurrentFrame();

  const beads = Array.from({ length: 28 }).map((_, i) => {
    const x = seededUnit(i * 10) * 100;
    const y = seededUnit(i * 10 + 1) * 100;
    const size = 10 + seededUnit(i * 10 + 2) * 40;
    const hueOffset = seededUnit(i * 10 + 3) * 60 - 30;
    const speed = 0.2 + seededUnit(i * 10 + 4) * 0.5;
    const offsetY = interpolate(frame * speed, [0, 1800], [0, -200], { extrapolateRight: 'extend' });

    return { id: i, x, y, size, hueOffset, offsetY };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background, overflow: 'hidden' }}>
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 30% 30%, ${accent}40 0%, transparent 50%), radial-gradient(circle at 70% 70%, ${THEME.colors.yellow}30 0%, transparent 60%)`,
        filter: 'blur(100px)'
      }} />

      {beads.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          left: `${b.x}%`,
          top: `${b.y}%`,
          width: b.size,
          height: b.size,
          borderRadius: '50%',
          backgroundColor: THEME.colors.cream,
          opacity: 0.1 + (b.size / 100) * 0.2,
          filter: `hue-rotate(${b.hueOffset}deg)`,
          transform: `translate3d(0, ${b.offsetY}px, 0)`,
        }} />
      ))}
    </AbsoluteFill>
  );
};
