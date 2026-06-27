export const dwatcherPalette = {
  // Dark base
  background: '#1a1a2e',
  'background-mid': '#2d2d44',
  'background-light': '#3a3a55',
  surface: '#252540',

  // Primary accent (brand red)
  accent: '#e94560',
  'accent-light': '#f0627a',
  'accent-pale': 'rgba(233, 69, 96, 0.15)',

  // Text hierarchy
  text: '#ffffff',
  'text-mid': '#a0a0b0',
  'text-soft': '#7a7a8a',
  'text-inverse': '#1a1a2e',

  // Semantic
  success: '#4caf50',
  warning: '#ff9800',
  error: '#e94560',
  info: '#2196f3',

  // Neutrals
  border: '#3a3a55',
  'border-light': '#2d2d44',
  white: '#ffffff',
} as const;

export type DwatcherPaletteKey = keyof typeof dwatcherPalette;
