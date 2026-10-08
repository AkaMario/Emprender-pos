import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, View, type ViewProps } from 'react-native';

export function KeyboardSafeView({ children, style }: Pick<ViewProps, 'children' | 'style'>) {
  const container = useRef<View>(null);
  const [top, setTop] = useState(0);

  return <View ref={container} collapsable={false} style={{ flex: 1 }} onLayout={() => {
    // Keyboard coordinates use the window origin; forms may sit below a navbar.
    container.current?.measureInWindow((_x, y) => setTop(y));
  }}>
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      keyboardVerticalOffset={top}
    >{children}</KeyboardAvoidingView>
  </View>;
}
