# Refactorización UX/UI

Este documento registra la primera refactorización. La paleta y la verificación vigente se describen en [Tema azul y modos del sistema](tema-azul.md).

## Inspección y decisiones

La aplicación usa Expo Router, React Native, NativeWind y SQLite, con flujos de restaurante y comercio multirubro. Se conservaron los modelos, repositorios, contratos y dependencias existentes. El proyecto declara Expo 57; se consultó la documentación versionada de Expo 54 exigida por AGENTS.md sin cambiar de SDK.

Se revisaron rutas principales, pantallas secundarias, autenticación, configuración, ventas, catálogo, inventario, reportes, categorías y selección de QR. Los problemas encontrados fueron navegación inferior oculta, cabeceras secundarias duplicadas, regresos sin alternativa para enlaces directos, menú lateral implementado como vistas absolutas, modal de categorías sin cierre por backdrop, estilos de formulario dispersos, controles pequeños, PIN visible, envío de contraseña sin bloqueo y promesas de carga sin tratamiento de error.

Las skills disponibles cubren Figma, generación de imágenes, documentos y otros servicios; no había una skill específica de auditoría UX, accesibilidad móvil o refactorización React Native. No se invocaron skills de Figma porque este trabajo modifica directamente una aplicación existente, sin un archivo Figma de referencia. Se aplicaron prácticas equivalentes, sin instalar dependencias.

## Implementación por fases

1. **Sistema de diseño:** paleta naranja y slate para ambos temas, escala de espaciado, radios y límites de ancho centralizados en `constants/design.ts`. Controles comunes para botones, campos, grupos de campos, selecciones y mensajes. La paleta principal se sincronizó con el tema existente.
2. **Navegación:** Inicio, Catálogo y Ventas visibles en la barra inferior. Inventario, Operaciones, Reportes y Configuración permanecen en el menú. El menú usa un modal nativo, desplazamiento, estado seleccionado, X y backdrop. `app/view/_layout.tsx` proporciona una cabecera y áreas seguras comunes; los regresos respetan historial y tienen retorno a `/`.
3. **Diálogos:** `Dialog` centraliza X, backdrop, regreso Android, escape de accesibilidad, contenido desplazable y manejo del teclado. Las confirmaciones y mensajes de la interfaz se trasladaron de Alert nativo a una cola de diálogos compartidos. Los callbacks de confirmación siguen ejecutando las operaciones originales; cerrar una confirmación no ejecuta su acción destructiva. El movimiento se reduce según la preferencia del sistema.
4. **Protección de datos:** guardas de navegación en artículos, platos, insumos, movimientos de inventario, ventas, cancelación de ventas y cambios de seguridad. Los formularios inicializan la comparación después de cargar los datos existentes. Un guardado exitoso actualiza la referencia para permitir la salida. Las pestañas conservan sus formularios montados; cambiar de sección no borra el carrito. La pestaña/ventana web muestra la protección nativa del navegador si se intenta cerrar con cambios.
5. **Formularios:** etiquetas y estados de foco compartidos, ayudas y errores por campo en artículos, platos e insumos; cantidad inválida indicada en movimientos. Se mantienen las validaciones del repositorio. Autocompletado de usuario y contraseña, textos de autenticación en español y bloqueo del envío de contraseña pendiente. PIN compartido con dígitos ocultos, nombres accesibles y distribución desplazable.
6. **Consistencia visual:** desplazamiento vertical compartido con límite de ancho para tablet/web y manejo del teclado; desplazamientos horizontales mantienen su comportamiento independiente. Controles legacy comparten tamaño táctil mínimo de 48, estado deshabilitado, presión y foco. QR ajustado al ancho disponible. Cargas y errores recuperables con Reintentar en listas y detalles. Cancelar una venta requiere confirmar la operación.
7. **Verificación:** análisis estático, pruebas de negocio y regresiones de componentes, exportación de bundles para las tres plataformas.

`tsconfig.json` tenía una modificación previa que había eliminado la configuración base de Expo. Se restituyó `extends: "expo/tsconfig.base"` conservando las opciones y rutas presentes, porque la comprobación inicial fallaba por JSX deshabilitado y tipos de bibliotecas incompatibles.

## Evidencia de verificación

- `npm run test`: **19/19 aprobadas** (13 de negocio con SQLite real en memoria y 6 de interfaz).
- `npm run typecheck`: aprobado, sin errores.
- `npm run lint`: aprobado, sin errores ni advertencias.
- `git diff --check`: aprobado.
- `npx expo export --platform all --output-dir /tmp/pos-ux-export`: aprobado: bundles de Android/iOS y exportación estática web (44 rutas); esto no genera ni prueba APK/IPA.

Las pruebas UX renderizan los componentes reales mediante React y sustituyen las primitivas del dispositivo. Comprueban las rutas de cierre de diálogos, protección durante edición/escritura, semántica accesible de campos y botones, ausencia de doble ejecución destructiva, continuidad de la acción de navegación y contraste AA (4.5:1) de pares de texto del sistema de diseño. No son pruebas end-to-end ni verifican comportamiento físico del sistema operativo.

## Validación manual pendiente

No había navegador automatizable, simulador ni dispositivo conectado en el entorno. No se verificaron visualmente capturas, teclado físico, gesto predictivo Android, VoiceOver/TalkBack, restauración de foco en dispositivos, orientación, tamaños de fuente máximos ni todos los flujos end-to-end. No se certifica cumplimiento integral de WCAG ni preparación final para publicación.

Antes de publicar, comprobar en Android/iOS: abrir pantallas secundarias mediante enlace directo; volver con formulario modificado y elegir conservar/descartar; pulsar dentro/fuera de un diálogo; cerrar con regreso del sistema; completar una venta de cada modelo; guardar y editar un plato; registrar entrada/salida de inventario; cancelar una venta; cambiar PIN/contraseña; probar un ancho de 320 puntos y texto ampliado con el teclado abierto. La orientación declarada continúa siendo vertical.

Fuentes consultadas: [Expo 54](https://docs.expo.dev/versions/v54.0.0/), [áreas seguras en Expo 54](https://docs.expo.dev/versions/v54.0.0/sdk/safe-area-context/), [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/). Se consultaron también las páginas oficiales de accesibilidad de Material Design 3 y Apple HIG; su contenido requiere JavaScript y no pudo recuperarse íntegramente con la herramienta de lectura.

## Archivos modificados

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/settings.tsx`
- `app/_layout.tsx`
- `app/business-setup.tsx`
- `app/login.tsx`
- `app/modal.tsx`
- `app/view/_layout.tsx`
- `app/view/business/offering.tsx`
- `app/view/category/category-view.tsx`
- `app/view/dashboard/alerts.tsx`
- `app/view/dashboard/sale-detail.tsx`
- `app/view/inventory/create.tsx`
- `app/view/inventory/history.tsx`
- `app/view/login/existing-login.tsx`
- `app/view/login/password-setup.tsx`
- `app/view/login/pin-setup.tsx`
- `app/view/login/security-setup.tsx`
- `app/view/login/username-setup.tsx`
- `app/view/qr/select-qr.tsx`
- `app/view/settings/change-password.tsx`
- `app/view/settings/change-pin.tsx`
- `app/view/settings/change-security-question.tsx`
- `components/business/pos.tsx`
- `components/business/sale-detail.tsx`
- `components/business/ui.tsx`
- `components/dashboard/home-dashboard.tsx`
- `components/inventory/inventory-adjustment-screen.tsx`
- `components/inventory/inventory-screen.tsx`
- `components/layout/navbar.tsx`
- `components/layout/sidebar.tsx`
- `components/login/auth-ui.tsx`
- `components/menu/dish-form-screen.tsx`
- `components/menu/menu-screen.tsx`
- `components/reports/reports-screen.tsx`
- `components/sales/pos-screen.tsx`
- `components/settings/pin-auth-view.tsx`
- `components/ui/action-pressable.tsx`
- `components/ui/alerts.tsx`
- `components/ui/dialog.tsx`
- `components/ui/form-input.tsx`
- `components/ui/load-feedback.tsx`
- `components/ui/pin-pad.tsx`
- `components/ui/screen-scroll.tsx`
- `constants/design.ts`
- `constants/theme.ts`
- `docs/ux/refactorizacion.md`
- `hooks/use-form-protection.tsx`
- `hooks/use-unsaved-changes.tsx`
- `scripts/tests/ux.test.cjs`
- `tsconfig.json`
