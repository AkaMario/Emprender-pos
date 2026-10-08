# Tema azul y modos del sistema

La corrección posterior de la fusión de estilos de botones y su evidencia visual se documenta en [Botones y validación](botones-y-validacion.md).

## Resultado y decisiones

Se extendió el sistema de diseño existente con una paleta azul y dos temas explícitos. No se añadieron dependencias ni se modificaron repositorios, esquema SQLite, reglas de negocio o destinos de navegación en esta actualización de colores. El proyecto usa Expo 57, NativeWind 4 y React Native 0.86; se leyó la documentación de Expo 54 exigida por AGENTS.md y se contrastaron las APIs con los paquetes instalados, conservando las versiones del proyecto.

Las skills disponibles no incluían una específica de UI móvil, teoría del color, dark mode o auditoría de accesibilidad. Se aplicaron prácticas equivalentes: tokens semánticos, superficies por elevación, controles de 48 puntos, estados accesibles y comprobaciones numéricas de contraste. No se invocaron skills de Figma porque no se proporcionó un diseño Figma ni se pidió escribir en ese servicio.

- El azul identifica botones principales, enlaces, selección, navegación activa, progreso y foco. Los textos de contenido e iconos secundarios permanecen neutros.
- El tema claro usa azul `#2563EB`, fondo `#F8FAFC` y superficies blancas. El oscuro usa azul `#60A5FA`, fondo `#0B1220` y superficies `#111827` / `#1E293B`.
- `onPrimary` es blanco en claro y oscuro azulado en dark mode. Esta distinción conserva contraste sobre el azul claro de los botones oscuros.
- Error, éxito y advertencia conservan su significado y tienen contenedores propios. Los fondos de las etiquetas no se calculan concatenando opacidad al color, lo que también permite usar variables CSS en web.
- Se distingue `border`, para límites de controles con contraste suficiente, de `separator`, para divisiones decorativas. El borde de controles es más visible que el borde tenue de la paleta de referencia.
- Los botones comparten foco azul; la presión usa colores o una escala sutil en controles heredados. Las tarjetas de catálogo y alertas leídas mantienen legibilidad. Las alertas leídas añaden una etiqueta textual.
- El logotipo de autenticación muestra Emprender y un símbolo de tienda mediante código con los tokens del tema. Se conservan los archivos raster existentes del icono y del splash.

## Arquitectura y arranque

`constants/color-tokens.json` es la fuente compartida de colores para código, Tailwind y configuración nativa. `constants/design.ts` proporciona `useDesignColors`, resolución por plataforma, variables NativeWind y contenedores de estado; `constants/theme.ts` mantiene compatibilidad con los componentes temáticos existentes.

`ThemeRoot` usa el hook de tema existente, basado en `useColorScheme` de React Native. No guarda una preferencia propia ni fuerza un tema: el sistema determina el modo en cada apertura y los cambios de su preferencia actualizan los componentes. El proveedor cubre también autenticación, cargas y errores iniciales. React Navigation, StatusBar y el fondo nativo reciben el mismo tema. Las variables NativeWind se suministran al árbol nativo.

En web, las variables CSS y `prefers-color-scheme` resuelven el modo antes de la hidratación y reaccionan a cambios del navegador. `app/+html.tsx` define el fondo, texto y metadatos de tema del documento desde el primer HTML. Los estilos React Native Web usan `var(--theme-...)`, compatible con su normalizador de colores.

`app.config.js` deriva el fondo inicial y las variantes de splash del JSON compartido y activa `expo-system-ui`, ya instalado. El plugin interno de Android genera el fondo nocturno de la actividad, colores primario/acento de controles nativos para ambos modos y atributos de apariencia de las barras que siguen el tema nativo. Se conserva la presentación edge-to-edge. El splash nativo permanece visible hasta ajustar el fondo de la vista raíz.

**La configuración del splash, las barras y los recursos nativos requiere una nueva compilación del development build o de la aplicación.** Actualizar solamente JavaScript o probar en Expo Go no aplica toda esa configuración.

## Pantallas y componentes actualizados

Se migraron autenticación, configuración inicial, Inicio, catálogo, inventario, ventas, operaciones, reportes, categorías, QR, ajustes de seguridad y vistas de detalle. También los tabs, Navbar, Sidebar, botones, formularios, PIN, estados de carga/error, alertas y diálogos. Los gráficos usan una serie semántica compartida con valores adaptados a ambos temas. El selector de fecha nativo recibe el tema activo y los colores correspondientes cuando su API los admite.

Los overlays usan un scrim separado del contenido; así la opacidad del fondo no reduce el contraste de los formularios y textos del diálogo.

## Verificación

- `npm test`: **25/25 aprobadas**: 13 pruebas de negocio con SQLite real y 12 de interfaz/temas.
- `npm run typecheck`: sin errores.
- `npm run lint`: sin errores ni advertencias.
- `git diff --check`: sin errores de espacios.
- Exportación con `npx expo export --platform all --output-dir /tmp/pos-blue-theme-export`: bundles Android/iOS y 44 rutas web estáticas.
- Introspección con `npx expo config --type introspect --json`: resolución de la configuración y aplicación del plugin de recursos nativos.

Las pruebas calculan luminancia relativa y contraste: texto normal al menos 4.5:1 en las superficies compartidas, etiquetas y botones; iconos, límites de controles y series gráficas al menos 3:1 en sus superficies. Comprueban también las combinaciones de los gráficos sobre contenedores azules y el estado pressed de botones. Los pares compartidos cumplen esos umbrales en ambos temas. Esto no constituye una certificación completa WCAG de cada pantalla.

Los componentes reales de botón, campo, loader y diálogo se renderizan con primitivas nativas simuladas, cambiando el modo suministrado al hook y montándolos nuevamente. Se comprueban colores, estados y fondos. La prueba de CSS ejecuta PostCSS/Tailwind real y verifica variables, utilidades semánticas y la consulta automática de tema. Otras pruebas verifican la configuración nativa y detectan colores literales o utilidades antiguas en las vistas.

## Límites y comprobación en dispositivos

No había simulador, dispositivo conectado ni navegador automatizable. La exportación produce bundles, no un APK/IPA probado. No se verificaron físicamente el cambio de preferencia del teléfono con la aplicación abierta, el reinicio, los destellos iniciales ni la apariencia real de las barras. Tampoco se revisaron capturas de todas las pantallas o VoiceOver/TalkBack. El mecanismo y la configuración están implementados; esas pruebas end-to-end siguen pendientes.

En un build actualizado, abrir cada sección en claro y oscuro; alternar el modo del sistema mientras se muestra un formulario y un diálogo; cerrar y volver a abrir en oscuro; observar splash, áreas seguras, barra de estado y navegación Android por gestos y por botones; probar selección, errores, carga, controles deshabilitados y texto ampliado. En web, probar ambos modos desde la carga inicial y cambiar la preferencia con la página abierta.

## Archivos

| Área | Archivos principales |
|---|---|
| Tokens y compatibilidad | `constants/color-tokens.json`, `constants/design.ts`, `constants/theme.ts`, `hooks/use-theme-color.ts`, `tailwind.config.js` |
| Proveedor y arranque | `components/layout/theme-root.tsx`, `app/_layout.tsx`, `app/+html.tsx`, `app.config.js`, `app.json`, `plugins/with-system-theme.js` |
| Navegación | `app/(tabs)/_layout.tsx`, `app/view/_layout.tsx`, `components/layout/{app-layout,navbar,sidebar}.tsx` |
| Controles y estados | `components/business/ui.tsx`, `components/ui/{action-pressable,dialog,form-input,load-feedback,pin-pad,collapsible}.tsx`, `components/themed-text.tsx` |
| Autenticación | `components/login/auth-ui.tsx`, `components/settings/pin-auth-view.tsx`, `app/login.tsx`, `app/view/login/*.tsx`, `app/view/settings/*.tsx` |
| Vistas de negocio | `app/business-setup.tsx`, `app/(tabs)/{settings,explore}.tsx`, `app/modal.tsx`, `app/view/business/offering.tsx`, `app/view/category/category-view.tsx`, `app/view/dashboard/*.tsx`, `app/view/inventory/*.tsx`, `app/view/qr/select-qr.tsx` |
| Componentes de negocio | `components/business/{pos,sale-detail}.tsx`, `components/dashboard/home-dashboard.tsx`, `components/inventory/*.tsx`, `components/menu/*.tsx`, `components/reports/reports-screen.tsx`, `components/sales/pos-screen.tsx` |
| Pruebas y documentación | `scripts/tests/ux.test.cjs`, `docs/ux/tema-azul.md`, nota de actualización en `docs/ux/refactorizacion.md` |

La carpeta de trabajo conserva además cambios de la refactorización UX anterior. Este informe describe específicamente la actualización de colores y temas.

## Referencias

- [Documentación Expo 54 solicitada por AGENTS.md](https://docs.expo.dev/versions/v54.0.0/).
- [Temas de color en Expo](https://docs.expo.dev/develop/user-interface/color-themes/).
- [React Native useColorScheme](https://reactnative.dev/docs/usecolorscheme).
- [Variables de NativeWind](https://www.nativewind.dev/docs/api/vars).
- [Contraste de texto WCAG](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [Contraste de controles y gráficos WCAG](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
