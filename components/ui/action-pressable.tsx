import React, { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { metrics, useDesignColors } from '@/constants/design';

// NativeWind merges className into style. A function-valued style can be
// replaced during that merge, dropping inline colors, focus and disabled state.
// Evaluate legacy callbacks here and pass a concrete style array to the primitive.
export function ActionPressable({ style, onFocus, onBlur, onPressIn, onPressOut, onHoverIn, onHoverOut, accessibilityState, ...props }: PressableProps) {
  const [focused, setFocused] = useState(false); const [pressed, setPressed] = useState(false); const [hovered, setHovered] = useState(false); const c = useDesignColors();
  return <Pressable accessibilityRole="button" {...props} accessibilityState={{ disabled: Boolean(props.disabled), ...accessibilityState }}
    onFocus={(event) => { setFocused(true); onFocus?.(event); }} onBlur={(event) => { setFocused(false); setPressed(false); onBlur?.(event); }}
    onPressIn={(event) => { setPressed(true); onPressIn?.(event); }} onPressOut={(event) => { setPressed(false); onPressOut?.(event); }}
    onHoverIn={(event) => { setHovered(true); onHoverIn?.(event); }} onHoverOut={(event) => { setHovered(false); onHoverOut?.(event); }}
    style={[{ minWidth: metrics.touch, minHeight: metrics.touch, justifyContent: 'center', opacity: props.disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      typeof style === 'function' ? style({ pressed, hovered }) : style,
      focused ? { outlineWidth: 2, outlineOffset: 3, outlineColor: c.primary, outlineStyle: 'solid' } : {}]} />;
}
