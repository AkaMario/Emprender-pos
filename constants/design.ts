import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import colorTokens from './color-tokens.json';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radii = { control: 0, card: 0, dialog: 0 };
export const metrics = { touch: 48, content: 960, form: 560 };
export const palette = colorTokens;
export type DesignColors = typeof palette.light;
export type ThemeMode = keyof typeof palette;

export function themeVariables(colors: DesignColors) {
  return Object.fromEntries(Object.entries(colors).map(([name, hex]) => [
    `--color-${name}`,
    hex.slice(1).match(/../g)!.map((part) => parseInt(part, 16)).join(' '),
  ]));
}

// CSS media queries resolve the active web theme before hydration, avoiding a
// light HTML shell when the browser prefers dark. Native APIs receive hex colors.
const webColors = Object.fromEntries(Object.keys(palette.light).map((name) => [
  name, `var(--theme-${name})`,
])) as DesignColors;
export function resolveDesignColors(mode: ThemeMode): DesignColors {
  return Platform.OS === 'web' ? webColors : palette[mode];
}
export function useDesignColors(): DesignColors {
  return resolveDesignColors(useColorScheme());
}

// Status backgrounds remain valid hex colors on native and CSS variables on web.
export function colorContainer(colors: DesignColors, foreground: string): string {
  if (foreground === colors.error) return colors.errorContainer;
  if (foreground === colors.warning) return colors.warningContainer;
  if (foreground === colors.success) return colors.successContainer;
  if (foreground === colors.primary || foreground === colors.link) return colors.primaryContainer;
  return colors.surfaceElevated;
}
