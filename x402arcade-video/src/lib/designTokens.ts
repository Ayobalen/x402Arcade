// Design tokens matching x402Arcade app exactly

export const colors = {
  // Backgrounds
  bgPrimary: '#0a0a0f',
  bgSecondary: '#12121a',
  bgTertiary: '#1a1a2e',
  bgSurface: '#16162a',
  surfacePrimary: '#1e1e2e',
  surfaceSecondary: '#252535',
  surfaceTertiary: '#2d2d45',

  // Primary (Cyan)
  primary: '#00ffff',
  primaryHover: '#33ffff',
  primaryActive: '#00cccc',

  // Secondary (Magenta)
  secondary: '#ff00ff',
  secondaryHover: '#ff33ff',
  secondaryActive: '#cc00cc',

  // Semantic
  success: '#00ff88',
  warning: '#ffaa00',
  error: '#ff3366',
  info: '#3388ff',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#e0e0e0',
  textTertiary: '#a0a0a0',
  textMuted: '#606060',

  // Border
  border: '#2d2d4a',
  borderSubtle: '#1e1e38',
};

export const glows = {
  cyan: '0 0 10px rgba(0, 255, 255, 0.3)',
  cyanMd: '0 0 20px rgba(0, 255, 255, 0.4)',
  cyanLg: '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3)',
  cyanIntense:
    '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.4), 0 0 60px rgba(0, 255, 255, 0.2)',

  magenta: '0 0 10px rgba(255, 0, 255, 0.3)',
  magentaMd: '0 0 20px rgba(255, 0, 255, 0.4)',
  magentaLg: '0 0 30px rgba(255, 0, 255, 0.5), 0 0 60px rgba(255, 0, 255, 0.3)',
  magentaIntense:
    '0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.4), 0 0 60px rgba(255, 0, 255, 0.2)',

  green: '0 0 10px rgba(0, 255, 136, 0.3)',
  greenLg: '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',

  red: '0 0 10px rgba(255, 51, 102, 0.3)',
};

export const fonts = {
  display: "'Orbitron', monospace",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Noise texture overlay (signature x402Arcade element)
export const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

// Easing curves (exact from app)
export const easings = {
  cubicOut: [0.215, 0.61, 0.355, 1] as const,
  cubicIn: [0.55, 0.055, 0.675, 0.19] as const,
  cubicInOut: [0.645, 0.045, 0.355, 1] as const,
  expoOut: [0.19, 1, 0.22, 1] as const,
  backOut: [0.175, 0.885, 0.32, 1.275] as const,
  bounceOut: [0.34, 1.56, 0.64, 1] as const,
  elastic: [0.68, -0.6, 0.32, 1.6] as const,
};

// Animation durations in seconds
export const durations = {
  ultrafast: 0.075,
  fast: 0.1,
  quick: 0.15,
  default: 0.2,
  moderate: 0.3,
  slow: 0.4,
  slower: 0.5,
  slowest: 0.7,
};
