import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';

export const MushroomieIntro = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [0, 24], [0.94, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        backgroundColor: '#071014',
        color: '#fff7f2',
        justifyContent: 'center',
      }}
    >
      <h1
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 96,
          margin: 0,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        Mushroomie
      </h1>
    </AbsoluteFill>
  );
};
