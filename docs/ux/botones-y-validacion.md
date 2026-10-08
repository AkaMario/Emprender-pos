# Corrección de botones y verificación visual

## Diagnóstico confirmado

Se reprodujo un fallo en Chrome con el componente real `ActionPressable`: un control con `className="bg-surface"`, fondo azul en `style` y texto `onPrimary` perdía el fondo explícito. En claro quedaba blanco sobre blanco; en oscuro, texto `#0B1220` sobre `#111827`.

La causa estaba en la integración de estilos. El wrapper convertía siempre `style` en una función para gestionar presión/foco. NativeWind transforma `className` en estilos al llegar a la primitiva; su fusión puede reemplazar el valor de `style` cuando es una función. Se examinó el código instalado de `react-native-css-interop` y se confirmó el resultado en el navegador. También se perdían el tamaño mínimo y la opacidad de deshabilitado definidos por ese callback. Las pruebas anteriores con primitivas simuladas no cubrían esa fusión real.

| Caso | Antes | Después |
|---|---|---|
| Fondo explícito en claro | Blanco; texto blanco | Azul `#2563EB`; texto blanco |
| Fondo explícito en oscuro | Superficie oscura; texto oscuro | Azul `#60A5FA`; texto `#0B1220` |
| Callback de controles heredados | Se pasaba a NativeWind | Se evalúa antes; la primitiva recibe estilos concretos |
| Deshabilitado del botón compartido | Opacidad general | Superficie y texto semánticos; opacidad completa |

## Skills consultadas

El MCP `ui-skills` estuvo disponible. Se ejecutó `list_skills`, se examinó su catálogo de 343 entradas, se filtró por diseño y se usó `get_skill` para leer estas instrucciones:

- [Baseline UI](https://www.ui-skills.com/skills/ibelick/baseline-ui/llms.txt): conservar primitivas existentes, nombres accesibles, áreas seguras y tokens establecidos.
- [Fixing accessibility](https://www.ui-skills.com/skills/ibelick/fixing-accessibility/llms.txt): correcciones localizadas, foco visible, estados anunciados, iconos identificables y contraste verificable.
- [Frontend UI engineering](https://www.ui-skills.com/skills/addyosmani/frontend-ui-engineering/llms.txt): componentes compartidos, jerarquía y espaciado existentes, semántica, variantes y comprobaciones responsivas.
- [Design system](https://www.ui-skills.com/skills/nextlevelbuilder/design-system/llms.txt): separación de colores semánticos y especificaciones de variantes/estados del componente.

Las recomendaciones específicas de HTML se adaptaron a las APIs de React Native y React Native Web. Se conservaron las primitivas y dependencias existentes, sin introducir bibliotecas de componentes web en la aplicación móvil. La documentación [Expo 54](https://docs.expo.dev/versions/v54.0.0/) se volvió a leer conforme a AGENTS.md; se conservaron las versiones instaladas del proyecto.

## Implementación

`ActionPressable` registra presión, hover y foco mediante los eventos de la primitiva. Evalúa cualquier callback de estilo heredado antes de pasarlo a NativeWind. Así conserva las reglas de la clase y los estilos en línea, con la prioridad esperada. Se preservaron los handlers existentes.

`components/ui/button.tsx` es el botón compartido. Sus colores y variantes se resuelven en `constants/button-styles.ts` a partir del tema existente. `components/business/ui.tsx` lo reexporta para conservar los consumidores previos. Las propiedades `secondary` y `destructive` siguen siendo compatibles.

| Variante | Fondo | Primer plano | Presión |
|---|---|---|---|
| Primary | Azul sólido | `onPrimary` | `primaryPressed` |
| Secondary | Superficie; contenedor azul si seleccionado | `link` | Superficie elevada |
| Outline | Transparencia intencional, borde visible | `link` | Superficie elevada |
| Ghost | Transparencia intencional | `link` | Contenedor azul |
| Destructive | Error semántico | `onError` | Cambio sutil de escala |

Los estados de foco usan un contorno azul de dos puntos con separación exterior. La selección expone su estado accesible y añade una marca visible. Los botones deshabilitados usan `disabled` y una superficie neutra, bloquean la interacción y conservan legibilidad. Loading conserva la variante, anuncia busy y muestra un indicador con el mismo color que el texto. Iconos, etiquetas y loaders reciben el mismo primer plano. El botón no admite sobrescribir su fondo mediante estilos de pantalla.

Se migraron las acciones de guardar plato/insumo, registrar movimiento, confirmar venta, cancelar venta, exportar reportes, crear plato/categoría y seleccionar/eliminar QR. Las acciones destructivas usan su variante semántica. Navbar, Sidebar y PIN comparten el wrapper con foco visible. Los campos compartidos reciben `keyboardAppearance`, cursor y selección del tema activo cuando la plataforma lo admite.

Se conservaron el proveedor automático, las dos paletas y la configuración de arranque implementados en [Tema azul](tema-azul.md). No se cambiaron rutas, reglas de negocio, repositorios ni dependencias.

## Evidencia y pruebas ejecutadas

- `npm test`: **27/27 aprobadas**, incluidas las 13 pruebas de negocio con SQLite real.
- `npm run typecheck`: sin errores.
- `npm run lint`: sin errores ni advertencias.
- `git diff --check`: aprobado.
- Exportación final: `npx expo export --platform all --output-dir /tmp/pos-ui-final`, con bundles Android/iOS y las **44 rutas originales** de web.
- Chrome headless: comparación antes/después con React Native Web y NativeWind reales, mediante Chrome DevTools Protocol; no se añadieron dependencias de automatización.

La matriz aislada montó los mismos componentes y el mismo proveedor de la aplicación. Las variantes se renderizaron en ambos temas, incluidas disabled, loading y selección. Se inspeccionaron las capturas y se calcularon contrastes a partir de estilos computados del navegador. Los 19 controles de cada tema tuvieron un contraste calculado mínimo de **5.17:1 en claro** y **5.71:1 en oscuro**, antes de considerar la opacidad del control heredado deshabilitado, que está exento del criterio normal de contraste. Los botones compartidos mantienen opacidad completa.

Pasaron las comprobaciones de cambio de preferencia sin recarga, recarga en oscuro, color pressed, foco de botón/campo, bloqueo de clics durante disabled/loading, ausencia de desbordamientos de controles a 320/768/1024 píxeles y cierre del diálogo con Escape. No se registraron excepciones de JavaScript en esa ejecución. Las pruebas existentes también comprueban X/backdrop/regreso del diálogo y protección de datos sin guardar.

La pantalla de auditoría se retiró del árbol de rutas antes de la exportación final. Su fuente queda en `scripts/fixtures/buttons-audit.tsx` para reproducir la matriz. Se verificó también la pantalla real de autenticación de la exportación final en ambos temas.

### Capturas

| Evidencia | Light | Dark |
|---|---|---|
| Reproducción antes de corregir | [Antes](evidencia/before-light.png) | [Antes](evidencia/before-dark.png) |
| Matriz de botones corregidos | [Después](evidencia/after-light.png) | [Después](evidencia/after-dark.png) |
| Diálogo real | [Diálogo](evidencia/dialog-light.png) | [Diálogo](evidencia/dialog-dark.png) |
| Autenticación final | [Login](evidencia/login-light.png) | [Login](evidencia/login-dark.png) |

[Resultados de estilos computados y comprobaciones](evidencia/browser-results.json).

## Archivos de esta corrección

- `components/ui/button.tsx`, `constants/button-styles.ts`: variantes y estados compartidos.
- `components/ui/action-pressable.tsx`: corrección de fusión con NativeWind, presión/hover/foco.
- `constants/color-tokens.json`: ajuste del texto deshabilitado claro.
- `components/business/ui.tsx`, `components/ui/form-input.tsx`: integración y teclado/selección.
- `components/layout/navbar.tsx`, `components/layout/sidebar.tsx`, `components/ui/pin-pad.tsx`: interacción y foco compartidos.
- `components/menu/{menu-screen,dish-form-screen}.tsx`, `components/inventory/inventory-adjustment-screen.tsx`, `components/sales/pos-screen.tsx`, `components/reports/reports-screen.tsx`: acciones principales.
- `app/view/inventory/create.tsx`, `app/view/category/category-view.tsx`, `app/view/dashboard/sale-detail.tsx`, `app/view/qr/select-qr.tsx`: acciones de formulario y destructivas.
- `scripts/tests/ux.test.cjs`, `scripts/fixtures/buttons-audit.tsx`, este informe y `docs/ux/evidencia/`: pruebas y evidencia.

La carpeta de trabajo conserva además las modificaciones de las refactorizaciones anteriores, documentadas por separado.

## Límites y pasos pendientes

La verificación visual cubre componentes compartidos, diálogo y autenticación; no constituye capturas de todas las pantallas de negocio ni una certificación integral WCAG. La auditoría de código y las pruebas cubren el uso de tokens en las vistas y la lógica existente. No se completaron todos los flujos de negocio mediante navegador.

No se dispuso de Android/iOS conectado ni simulador nativo. El cambio de apariencia del teléfono, teclado físico, barras del sistema, primer arranque y splash deben comprobarse en una nueva compilación nativa. La emulación de preferencia en Chrome verifica web, no el comportamiento físico del teléfono.

Para la revisión nativa: abrir catálogo, inventario, ventas, reportes y ajustes en ambos temas; cambiar el tema con un formulario/diálogo abierto; cerrar y reabrir en oscuro; activar carga y deshabilitado; probar iconos, PIN y enlaces; comprobar barras, teclado y splash. Las modificaciones de configuración nativa anteriores requieren recompilar la aplicación.
