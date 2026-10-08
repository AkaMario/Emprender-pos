import React from 'react';
import { Platform, ScrollView, type ScrollViewProps } from 'react-native';
import { metrics, spacing } from '@/constants/design';
import { KeyboardSafeView } from './keyboard-safe-view';
import { KeyboardAwareScroll } from './keyboard-aware-scroll';

export function ScreenScroll({ contentContainerStyle, ...props }: ScrollViewProps) {
  if (props.horizontal) return <ScrollView keyboardShouldPersistTaps="handled" {...props} contentContainerStyle={contentContainerStyle} />;
  return <KeyboardSafeView>
    <KeyboardAwareScroll keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} {...props}
      style={[{ flex: 1 }, props.style]}
      contentContainerStyle={[{ width: '100%', maxWidth: metrics.content, alignSelf: 'center', paddingBottom: spacing.xxl }, contentContainerStyle]} />
  </KeyboardSafeView>;
}
