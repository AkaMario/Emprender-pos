import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useDesignColors } from '@/constants/design';

export type TutorialRect = { x: number; y: number; width: number; height: number };
const easing = Easing.out(Easing.cubic);
export function useTutorialReducedMotion() {
  const initialReduced = useReducedMotion();
  const [reduced, setReduced] = useState(initialReduced);
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      if (mounted) setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted && !changed) setReduced(value);
    }).catch(() => {});
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return reduced;
}

export function TutorialSpotlight({ rect, width, height, reduced, step }: {
  rect: TutorialRect | null; width: number; height: number; reduced: boolean; step: number;
}) {
  const c = useDesignColors();
  const bounds = useSharedValue<TutorialRect>({ x: 0, y: 0, width: 0, height: 0 });
  const emphasis = useSharedValue(1);
  useEffect(() => {
    // Keep the previous opening while the next screen lays out, avoiding a dark flash.
    if (!rect) return;
    bounds.value = withTiming(rect, { duration: reduced ? 0 : 320, easing, reduceMotion: ReduceMotion.System });
  }, [rect, reduced, bounds]);
  useEffect(() => {
    emphasis.value = reduced ? 1 : withSequence(
      withTiming(0.5, { duration: 650, reduceMotion: ReduceMotion.System }),
      withTiming(1, { duration: 650, reduceMotion: ReduceMotion.System }),
    );
    return () => cancelAnimation(emphasis);
  }, [step, reduced, emphasis]);
  // Clamp even retained bounds when the device rotates during a transition.
  const top = useAnimatedStyle(() => ({ top: 0, left: 0, width, height: Math.min(bounds.value.y, height) }));
  const bottom = useAnimatedStyle(() => ({ top: Math.min(bounds.value.y + bounds.value.height, height), left: 0, width, bottom: 0 }));
  const left = useAnimatedStyle(() => ({ top: bounds.value.y, left: 0, width: Math.min(bounds.value.x, width), height: bounds.value.height }));
  const right = useAnimatedStyle(() => ({ top: bounds.value.y, left: Math.min(bounds.value.x + bounds.value.width, width), right: 0, height: bounds.value.height }));
  const outline = useAnimatedStyle(() => ({ left: bounds.value.x, top: bounds.value.y, width: bounds.value.width, height: bounds.value.height, opacity: bounds.value.width > 0 ? emphasis.value : 0 }));
  const shade = { position: 'absolute' as const, backgroundColor: c.scrim, opacity: 0.72 };
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
    <Animated.View style={[shade, top]} />
    <Animated.View style={[shade, bottom]} />
    <Animated.View style={[shade, left]} />
    <Animated.View style={[shade, right]} />
    <Animated.View style={[{ position: 'absolute', borderWidth: 2, borderColor: c.primary }, outline]} />
  </View>;
}

export function TutorialProgress({ index, total, reduced }: { index: number; total: number; reduced: boolean }) {
  const c = useDesignColors();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming((index + 1) / total, { duration: reduced ? 0 : 350, easing, reduceMotion: ReduceMotion.System });
  }, [index, total, reduced, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return <View accessibilityRole="progressbar" accessibilityLabel="Progreso del tutorial" accessibilityValue={{ min: 0, max: total, now: index + 1, text: `Paso ${index + 1} de ${total}` }}
    style={{ height: 4, backgroundColor: c.surfaceElevated, overflow: 'hidden' }}>
    <Animated.View style={[{ height: '100%', backgroundColor: c.primary }, fill]} />
  </View>;
}
