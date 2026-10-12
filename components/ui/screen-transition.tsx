import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// One short content transition, without a second native stack animation or
// remounting the screen. Navigation and input stay available throughout.
export function ScreenTransition({ children }: { children: React.ReactNode }) {
  const progress = useSharedValue(1);
  useFocusEffect(useCallback(() => {
    progress.set(0);
    progress.set(withTiming(1, { duration: 110, reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(progress);
  }, [progress]));
  const style = useAnimatedStyle(() => ({
    opacity: 0.96 + progress.get() * 0.04,
    transform: [{ translateY: (1 - progress.get()) * 3 }],
  }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}
