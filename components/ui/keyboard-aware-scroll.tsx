import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, TextInput, type ScrollViewProps } from 'react-native';

const keyboardMargin = 32;
const FocusContext = createContext<() => void>(() => {});
export const useRevealFocusedInput = () => useContext(FocusContext);

export function focusedInputScrollOffset(offset: number, inputTop: number, inputHeight: number, viewportTop: number, viewportBottom: number) {
  const visibleTop = viewportTop + keyboardMargin;
  const visibleBottom = viewportBottom - keyboardMargin;
  // Keep the start of very tall multiline fields visible as well.
  const bottom = inputTop + Math.min(inputHeight, Math.max(0, visibleBottom - visibleTop));
  if (bottom > visibleBottom) return offset + bottom - visibleBottom;
  if (inputTop < visibleTop) return Math.max(0, offset + inputTop - visibleTop);
  return offset;
}

export function KeyboardAwareScroll({ contentContainerStyle, onScroll, onLayout, onContentSizeChange, children, ...props }: ScrollViewProps) {
  const scroll = useRef<ScrollView>(null);
  const focused = useRef<ReturnType<typeof TextInput.State.currentlyFocusedInput> | null>(null);
  const offset = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const reveal = useCallback(() => {
    if (Platform.OS === 'web') return;
    const input = focused.current;
    const viewport = scroll.current;
    const keyboard = Keyboard.metrics();
    if (!input || !viewport || !keyboard || input !== TextInput.State.currentlyFocusedInput()) return;
    viewport.getNativeScrollRef()?.measureInWindow((_x, top, _width, height) => {
      input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
        if (input !== TextInput.State.currentlyFocusedInput()) return;
        const next = focusedInputScrollOffset(offset.current, inputTop, inputHeight, top, Math.min(top + height, keyboard.screenY));
        if (Math.abs(next - offset.current) > 1) viewport.scrollTo({ y: next, animated: true });
      });
    });
  }, []);

  const scheduleReveal = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    // Measure after native resize and KeyboardAvoidingView have laid out.
    timer.current = setTimeout(reveal, 100);
  }, [reveal]);

  const focus = useCallback(() => {
    if (Platform.OS === 'web') return;
    focused.current = TextInput.State.currentlyFocusedInput();
    setKeyboardOpen(Keyboard.isVisible());
    scheduleReveal();
  }, [scheduleReveal]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener('keyboardDidShow', () => { setKeyboardOpen(true); scheduleReveal(); });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
      focused.current = null;
      if (timer.current) clearTimeout(timer.current);
    });
    return () => { show.remove(); hide.remove(); if (timer.current) clearTimeout(timer.current); };
  }, [scheduleReveal]);

  const content = StyleSheet.flatten(contentContainerStyle);
  const paddingBottom = content?.paddingBottom ?? content?.paddingVertical ?? content?.padding ?? 0;
  return <FocusContext.Provider value={focus}>
    <ScrollView {...props} ref={scroll} keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? 'handled'}
      scrollEventThrottle={props.scrollEventThrottle ?? 16}
      onScroll={(event) => { offset.current = event.nativeEvent.contentOffset.y; onScroll?.(event); }}
      onLayout={(event) => { scheduleReveal(); onLayout?.(event); }}
      onContentSizeChange={(width, height) => { scheduleReveal(); onContentSizeChange?.(width, height); }}
      contentContainerStyle={[contentContainerStyle, keyboardOpen && { paddingBottom: (typeof paddingBottom === 'number' ? paddingBottom : 0) + 96 }]}
    >{children}</ScrollView>
  </FocusContext.Provider>;
}
