import { dwatcherPalette, type DwatcherPaletteKey } from './dwatcher-palette';

export { dwatcherPalette, type DwatcherPaletteKey } from './dwatcher-palette';
export { dwatcherSpacing } from './dwatcher-spacing';
export { dwatcherRadii } from './dwatcher-radii';
export { dwatcherShadows } from './dwatcher-shadows';
export { dwatcherTypography } from './dwatcher-typography';

// Convenience alias — `colors` is more natural to reference than `dwatcherPalette`
export const colors = dwatcherPalette;

// Helper to access palette colors by key
export function paletteColor(key: DwatcherPaletteKey): string {
  return dwatcherPalette[key];
}

// Placeholder objects for future population — ensures import paths exist
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const textStyles = {};
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const layoutStyles = {};
