import React, { useEffect } from 'react';
import { Appearance, Platform, View } from 'react-native';
import { vars } from 'nativewind';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { palette, themeVariables, useDesignColors } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync();
  void SystemUI.setBackgroundColorAsync(palette[Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'].background);
}

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const mode = useColorScheme(); const c = useDesignColors();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: c.primary, background: c.background, card: c.surface, text: c.text, border: c.separator, notification: c.error } };
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void SystemUI.setBackgroundColorAsync(palette[mode].background).finally(() => { void SplashScreen.hideAsync(); });
  }, [mode]);
  return <View className="flex-1 bg-background" style={Platform.OS === 'web' ? undefined : vars(themeVariables(palette[mode]))}>
    <ThemeProvider value={theme}>{children}</ThemeProvider>
    <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
  </View>;
}
