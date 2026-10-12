import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { PlatformPressable } from 'expo-router/react-navigation';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return <PlatformPressable {...props}
    onPressIn={(event) => {
      if (process.env.EXPO_OS === 'ios') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      props.onPressIn?.(event);
    }}
    />;
}
