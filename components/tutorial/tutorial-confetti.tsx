import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { CONFETTI_COLORS } from '@/constants/confetti';

const pieces = Array.from({ length: 48 }, (_, index) => ({
  id: index, spread: ((index * 17) % 49) / 48 - 0.5,
  delay: ((index * 7) % 11) / 60, spin: (index % 2 ? 1 : -1) * (360 + (index % 5) * 120),
  size: 6 + (index % 4) * 2, color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));
function ConfettiPiece({ piece, progress, width, height }: { piece: typeof pieces[number]; progress: SharedValue<number>; width: number; height: number }) {
  const animated = useAnimatedStyle(() => {
    const time = Math.max(0, Math.min(1, (progress.value - piece.delay) / (1 - piece.delay)));
    return {
      opacity: time <= 0 ? 0 : Math.min(1, (1 - time) * 5),
      transform: [
        { translateX: width / 2 + piece.spread * width * 1.6 * (1 - (1 - time) ** 2) + Math.sin(time * 12 + piece.id) * 12 },
        { translateY: height * 0.3 - Math.sin(time * Math.PI) * height * (0.22 + (piece.id % 3) * 0.04) + time ** 2 * height },
        { rotate: `${piece.id * 31 + time * piece.spin}deg` },
        { rotateX: `${time * piece.spin * 1.5}deg` },
      ],
    };
  });
  return <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: piece.size, height: piece.size * 0.55, borderRadius: piece.id % 3 === 0 ? piece.size : 1, backgroundColor: piece.color }, animated]} />;
}
export function TutorialConfetti({ width, height }: { width: number; height: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 1800, easing: Easing.linear, reduceMotion: ReduceMotion.System });
    return () => cancelAnimation(progress);
  }, [progress]);
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>
    {pieces.map((piece) => <ConfettiPiece key={piece.id} piece={piece} progress={progress} width={width} height={height} />)}
  </View>;
}
