import React, { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import { palette } from '@/constants/design';

// Static shell colors take effect before CSS/JS loads, matching the browser's
// preference on first paint and after a reload without persisting an override.
const startupCSS = `
:root { color-scheme: light dark; }
html, body { background: ${palette.light.background}; color: ${palette.light.text}; }
@media (prefers-color-scheme: dark) {
  html, body { background: ${palette.dark.background}; color: ${palette.dark.text}; }
}
`;
export default function RootHTML({ children }: PropsWithChildren) {
  return <html lang="es"><head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content={palette.light.background} media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content={palette.dark.background} media="(prefers-color-scheme: dark)" />
    <ScrollViewStyleReset />
    <style dangerouslySetInnerHTML={{ __html: startupCSS }} />
  </head><body>{children}</body></html>;
}
