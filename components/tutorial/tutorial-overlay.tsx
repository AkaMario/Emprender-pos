import { TutorialConfetti } from "./tutorial-confetti";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { Easing, FadeInDown, FadeInLeft, FadeInRight, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTutorial } from '@/context/tutorial';
import { useBusiness } from '@/context/business';
import { useDesignColors } from '@/constants/design';
import { Button, ErrorText } from '@/components/business/ui';
import { TutorialProgress, TutorialSpotlight, useTutorialReducedMotion, type TutorialRect } from './tutorial-motion';
import type { TutorialTarget } from '@/domain/tutorial';

const entrance = FadeInDown.duration(280).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System);
const forward = FadeInRight.duration(260).reduceMotion(ReduceMotion.System);
const backward = FadeInLeft.duration(260).reduceMotion(ReduceMotion.System);
const cardLayout = LinearTransition.duration(260).reduceMotion(ReduceMotion.System);
const icons: Record<TutorialTarget, React.ComponentProps<typeof Ionicons>['name']> = {
  settings: 'settings-outline', menu: 'grid-outline', inventory: 'cube-outline', operations: 'clipboard-outline', sales: 'receipt-outline',
};

export function TutorialOverlay() {
  const { index, steps, busy, error, celebrating, move, close, targets } = useTutorial();
  const { definition } = useBusiness();
  const router = useRouter();
  const pathname = usePathname();
  const c = useDesignColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useTutorialReducedMotion();
  const scroll = useRef<ScrollView>(null);
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moving = useRef(false);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState(1);
  const [measurement, setMeasurement] = useState<{ rect: TutorialRect; target: string; width: number; height: number } | null>(null);
  const current = index === null ? null : steps[index];
  const route = current ? `/${current.target}` : '';
  const rect = measurement?.target === current?.target && pathname === route && measurement?.width === width && measurement?.height === height ? measurement.rect : null;
  const measure = useCallback(() => {
    if (!current || pathname !== route) return;
    targets.current[current.target]?.measureInWindow((x, y, w, h) => {
      if (w <= 0 || h <= 0) return;
      const left = Math.max(8, x + 8), top = Math.max(insets.top + 8, y + 8);
      setMeasurement({ target: current.target, width, height, rect: { x: left, y: top, width: Math.max(0, Math.min(w - 16, width - left - 8)), height: Math.max(0, Math.min(170, h - 16, height * 0.25)) } });
      if (retryTimer.current) { clearInterval(retryTimer.current); retryTimer.current = null; }
    });
  }, [current, pathname, route, targets, width, height, insets.top]);
  useEffect(() => {
    if (current && pathname !== route) router.navigate(`/(tabs)/${current.target}` as never);
  }, [current, pathname, route, router]);
  useEffect(() => {
    if (!current || pathname !== route) return;
    let attempts = 0;
    const frame = requestAnimationFrame(measure);
    retryTimer.current = setInterval(() => {
      measure();
      if (++attempts >= 10 && retryTimer.current) { clearInterval(retryTimer.current); retryTimer.current = null; }
    }, 80);
    return () => {
      cancelAnimationFrame(frame);
      if (retryTimer.current) { clearInterval(retryTimer.current); retryTimer.current = null; }
    };
  }, [current, pathname, route, measure]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [index]);
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
  const changeStep = (delta: number) => {
    if (busy || moving.current) return;
    setDirection(delta);
    move(delta);
    if (!reduced) {
      moving.current = true; setTransitioning(true);
      transitionTimer.current = setTimeout(() => { moving.current = false; setTransitioning(false); }, 280);
    }
  };
  if (!current || index === null) return null;
  const isLast = index === steps.length - 1;
  // Retain the card's available space while measuring the next screen.
  const measuredTop = measurement?.height === height ? measurement.rect.y + measurement.rect.height : insets.top;
  return <Modal transparent visible animationType={reduced ? 'none' : 'fade'} statusBarTranslucent navigationBarTranslucent onShow={measure} onRequestClose={() => { void close(); }}>
    <View style={{ flex: 1 }} accessibilityViewIsModal onAccessibilityEscape={() => { void close(); }}>
      {celebrating ? <>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: c.scrim, opacity: 0.72 }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Animated.View entering={reduced ? undefined : entrance} accessibilityLiveRegion="polite" style={{ width: '100%', maxWidth: 420, padding: 28, gap: 16, alignItems: 'center', backgroundColor: c.surface }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.successContainer, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark" size={36} color={c.success} accessible={false} />
            </View>
            <Text accessibilityRole="header" style={{ color: c.text, fontSize: 24, fontWeight: '700', textAlign: 'center' }}>¡Tutorial completado!</Text>
            <Text style={{ color: c.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' }}>Ahora puedes configurar tu emprendimiento a tu ritmo.</Text>
          </Animated.View>
        </View>
        {!reduced && <TutorialConfetti width={width} height={height} />}
      </> : <>
      <TutorialSpotlight rect={rect} width={width} height={height} reduced={reduced} step={index} />
      <Animated.View entering={reduced ? undefined : entrance} layout={reduced ? undefined : cardLayout}
        style={{ position: 'absolute', left: Math.max(12, (width - 560) / 2), bottom: Math.max(insets.bottom, 12), maxHeight: Math.max(120, height - measuredTop - 24 - Math.max(insets.bottom, 12)), backgroundColor: c.surface, borderColor: c.separator, borderWidth: 1, padding: 20, gap: 16, width: Math.max(0, Math.min(width - 24, 560)), overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View key={`icon-${index}`} entering={reduced ? undefined : entrance}>
                <Ionicons name={isLast ? 'checkmark' : icons[current.target]} size={22} color={c.text} accessible={false} />
              </Animated.View>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: c.muted, fontSize: 13 }}>{definition?.title}</Text>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Paso {index + 1} de {steps.length}</Text>
            </View>
          </View>
          <TutorialProgress index={index} total={steps.length} reduced={reduced} />
        <ScrollView ref={scroll} style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 16 }}>
          <Animated.View key={`step-${index}`} entering={reduced ? undefined : direction > 0 ? forward : backward} style={{ gap: 12 }}>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>{current.title}</Text>
            <Text style={{ color: c.text, fontSize: 16, lineHeight: 25 }}>{current.description}</Text>
          </Animated.View>
          <ErrorText message={error} />
        </ScrollView>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {index > 0 && <Button title="Anterior" secondary disabled={busy || transitioning} onPress={() => changeStep(-1)} icon={(color) => <Ionicons name="arrow-back" size={18} color={color} accessible={false} />} />}
            <Button title={isLast ? 'Finalizar' : 'Siguiente'} disabled={transitioning} loading={busy} onPress={() => { if (isLast) void close(true); else changeStep(1); }} icon={(color) => <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color={color} accessible={false} />} />
            {!isLast && <Button title="Omitir tutorial" secondary disabled={busy} onPress={() => { void close(); }} />}
          </View>
      </Animated.View>
      </>}
    </View>
  </Modal>;
}
