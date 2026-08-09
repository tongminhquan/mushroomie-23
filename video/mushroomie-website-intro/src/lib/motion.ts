import {Easing, interpolate} from 'remotion';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const sceneOpacity = (frame: number, durationInFrames: number) => {
  // Each scene is intentionally rendered in a non-overlapping Sequence. A shell
  // fade would therefore expose the ambient background at every hand-off instead
  // of creating a cross-fade. Scene-local entrances provide the motion while the
  // shell remains visible for the whole assigned window.
  void frame;
  void durationInFrames;
  return 1;
};

export const enter = (
  frame: number,
  start: number,
  duration = 24,
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    easing: ease,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
