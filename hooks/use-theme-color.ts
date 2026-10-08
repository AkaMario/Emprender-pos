/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDesignColors } from '@/constants/design';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const c = useDesignColors();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const shared = { text: c.text, background: c.background, tint: c.primary, icon: c.icon, tabIconDefault: c.icon, tabIconSelected: c.primary };
    return shared[colorName];
  }
}
