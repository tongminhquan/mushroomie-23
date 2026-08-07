export const VERTICAL_THEME = {
  safe: {
    left: 72,
    right: 180,
    top: 150,
    bottom: 530,
  },
  caption: {
    bottom: 310,
    maxWidth: 800,
    maxHeight: 180,
    fontSize: 46,
    lineHeight: 1.12,
  },
  progress: {
    top: 112,
    height: 6,
  },
} as const;

export const VERTICAL_MAIN_WIDTH =
  1080 - VERTICAL_THEME.safe.left - VERTICAL_THEME.safe.right;

export const VERTICAL_MAIN_HEIGHT =
  1920 - VERTICAL_THEME.safe.top - VERTICAL_THEME.safe.bottom;
