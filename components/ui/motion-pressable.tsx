import React, { useEffect } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MotionPressableProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

export function usePressAnimation(disabled = false) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  useEffect(() => {
    if (disabled) { cancelAnimation(scale); scale.set(1); }
    return () => cancelAnimation(scale);
  }, [disabled, scale]);
  const release = () => { scale.set(withTiming(1, { duration: 80, reduceMotion: ReduceMotion.System })); };
  const press = () => {
    if (!disabled) scale.set(withTiming(0.985, { duration: 50, reduceMotion: ReduceMotion.System }));
  };
  return { style, press, release };
}

// Keep backgrounds concrete and animate only the transform, preserving contrast
// and layout while allowing an interrupted press to return smoothly to rest.
export function MotionPressable({ style, disabled, onPressIn, onPressOut, onBlur, ...props }: MotionPressableProps) {
  const motion = usePressAnimation(Boolean(disabled));
  return <AnimatedPressable {...props} disabled={disabled} style={[style, motion.style]}
    onPressIn={(event) => { motion.press(); onPressIn?.(event); }}
    onPressOut={(event) => { motion.release(); onPressOut?.(event); }}
    onBlur={(event) => { motion.release(); onBlur?.(event); }} />;
}
