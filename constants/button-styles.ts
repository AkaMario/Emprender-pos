import type { DesignColors } from './design';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export function buttonColors(c: DesignColors, variant: ButtonVariant, { pressed = false, disabled = false, selected = false } = {}) {
  if (disabled) return {
    background: variant === 'ghost' || variant === 'outline' ? 'transparent' : c.surfaceElevated,
    foreground: c.disabled,
    border: c.border,
  };
  switch (variant) {
    case 'primary': return { background: pressed ? c.primaryPressed : c.primary, foreground: c.onPrimary, border: c.primary };
    case 'destructive': return { background: c.error, foreground: c.onError, border: c.error };
    case 'secondary': return { background: selected ? c.primaryContainer : pressed ? c.surfaceElevated : c.surface, foreground: c.link, border: selected ? c.primary : c.border };
    case 'outline': return { background: selected ? c.primaryContainer : pressed ? c.surfaceElevated : 'transparent', foreground: c.link, border: selected ? c.primary : c.border };
    case 'ghost': return { background: selected || pressed ? c.primaryContainer : 'transparent', foreground: c.link, border: 'transparent' };
  }
}
