# Emprender: un tipo de emprendimiento por negocio

Fecha: 7 de octubre de 2026. Estado: base funcional implementada en la app, con persistencia local. Esta revisión sustituye la propuesta inicial que permitía combinar modelos.

## Regla de producto

Una aplicación incluye los cinco tipos de emprendimiento, pero cada negocio selecciona **uno solo** antes de entrar al POS. No hay activación simultánea de rubros ni carrito entre modelos. Servicios, contenido digital y suscripciones pertenecen a la misma categoría de intangibles. Los empaques son accesorios del flujo de granel, no un segundo rubro activado.

Flujo: registro/inicio de sesión → nombre y selección del emprendimiento → inicio adaptado → catálogo → venta/cobro → operación e informes. La elección se guarda en SQLite y sobrevive al cierre de sesión y al backup. La aplicación protege las rutas, las funciones de venta validan el modelo y la base impide cambiar/eliminar el perfil o insertar artículos/pedidos ajenos al modo elegido.

En bases existentes con platos, inventario o ventas de restaurante, el selector conserva restaurante. No se convierten esas operaciones en alquileres o productos fraccionados. La selección queda vinculada al archivo; cambiar el tipo de un negocio con información requerirá un flujo futuro de creación/migración de negocio, nunca una modificación silenciosa de sus datos.

## Funcionalidad incorporada

| Tipo seleccionado | Catálogo y venta | Operación desde la app |
| --- | --- | --- |
| Restaurante/preparación | POS existente, mesas, retiro, domicilio, recetas e insumos | Comandas con cola, preparación, listo y entrega; actualización cada 5 segundos. Validación agregada de insumos del carrito. |
| Granel/peso/volumen | Precio por ml/lt/g/kg/m, conversión compatible, cantidad bruta menos tara y empaques por pieza | Descuento exacto del contenido y del empaque seleccionado, envase reutilizable sin venta de empaque, historial y ajustes de stock. |
| Retail por unidad | SKU único, código de barras, descripción de variante, unidades enteras, lote y vencimiento | Stock por registro, bloqueo de lote vencido, historial, desactivación y cancelación con reintegro. |
| Alquiler/renta | Cada registro es un activo individual; tarifa por hora/día/mes y garantía | Calendario filtrable por día, rechazo de solapamientos, entrega/devolución, inspección, devolución/retención de garantía y mantenimiento. No consume el activo. |
| Servicios/digital | Servicios con duración, contenidos con enlace y planes por meses | Personal, citas sin solapamiento, registro de servicio realizado, compartir entrega digital y registrar su estado, vencimientos y renovación manual de suscripciones. |

Inicio, menú lateral, catálogo, ventas, inventario/disponibilidad/agenda, operaciones, reportes y detalle de venta se adaptan al tipo seleccionado. Configuración muestra nombre y tipo; los backups y el QR de transferencia siguen disponibles. Los informes del nuevo núcleo usan nombres/categorías congelados en las líneas y muestran garantías separadas de los ingresos.

## Arquitectura implementada

| Archivo/capa | Responsabilidad |
| --- | --- |
| `domain/business.ts` | Definición de los cinco modelos, tipos permitidos, unidades/dimensiones, cantidades exactas, dinero y periodos de calendario. |
| `context/business.tsx` | Carga del perfil después de autenticar, selección persistente y recuperación del estado al volver a iniciar sesión. |
| `app/business-setup.tsx`, layouts | Selección exclusiva y protección de rutas antes de mostrar la operación. |
| `database/business-schema.ts` | Fuente canónica del DDL aditivo v4; todas las modalidades están instaladas, aunque solo una se opera. |
| `database/business-database.ts` | Casos de uso del nuevo núcleo: catálogo, stock, venta, reservas, servicios, entregas, suscripciones y reportes. |
| `database/unit-of-work.ts` | Cola de operaciones y transacciones. En nativo usa conexión propia y activa FK antes de BEGIN; web serializa el nuevo núcleo sobre la conexión local. |
| `components/business/*` | Pantallas comunes adaptadas por configuración y pantallas de operación especializadas. |
| `database/pos-database.ts` | Adaptador operativo de restaurante, conservando tablas, contratos e IDs existentes. Incluye correcciones de consumo/cancelación y comandas. |
| `database/auth-database.ts` | Conexión/bootstrap, migración v4, autenticación y backups. La separación completa de auth y migraciones queda como siguiente refactor. |

El proyecto usa Expo SDK 57 y conserva la estructura Expo Router. La implementación original se basó en la documentación de [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/), [SQLite SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/sqlite/) y [Router SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/router/). La actualización sigue las [notas de SDK 57](https://expo.dev/changelog/sdk-57) y la [migración de imports de Expo Router](https://docs.expo.dev/router/migrate/sdk-55-to-56/).

## Modelo de datos activo

`database/schema.sql` conserva el bootstrap de restaurante v3. Al abrir la app, el inicializador amplía esa base a v4 mediante `BUSINESS_SCHEMA`, sin renombrar ni eliminar sus tablas. El [SQL de referencia](multirubro-reference.sql) se genera desde esa constante con `npm run db:reference`; no es un archivo que el usuario deba importar en su dispositivo.

| Tabla añadida | Propósito |
| --- | --- |
| `business_profile` | Singleton con nombre y uno de los cinco modelos. |
| `business_offerings` | Artículo vendible del modo elegido; precio, unidad, SKU, variante, stock o condiciones de operación. |
| `business_orders`, `business_order_lines` | Cobros registrados, clave de idempotencia, snapshots de nombre/categoría/unidad/precio/total. |
| `business_stock_movements` | Stock inicial, ajustes, consumos y reintegros firmados; se registra dentro de la transacción que modifica el saldo. |
| `business_staff` | Profesionales activos para asignación de citas. |
| `business_bookings` | Intervalos semiabiertos, personal o activo, estado e inspección/garantía. Triggers rechazan solapamientos al insertar y actualizar. |
| `business_accesses` | Código y enlace congelados, entrega pendiente/registrada y revocación registrada. |
| `business_subscriptions`, `business_subscription_cycles` | Condiciones de plan congeladas, próximo vencimiento y unicidad de ciclo cobrado. |
| `restaurant_preparation_tasks`, `restaurant_checkout_keys` | Comandas e idempotencia de nuevas ventas de restaurante, conservando referencia a `sales`. |

Cantidad: un millón de átomos por g, ml, m o pieza. `kg` equivale a mil millones de átomos de masa y `lt` a mil millones de volumen. Las conversiones entre dimensiones se rechazan y las piezas deben ser enteras. Se analizan cadenas decimales y se calcula con BigInt antes de persistir enteros seguros para JavaScript. El saldo, precio y total pasan validaciones de rango/precisión en los repositorios.

Dinero del nuevo núcleo: enteros en centavos de COP; se redondea una vez por línea a la menor unidad monetaria. Restaurante mantiene sus importes históricos en pesos y su formato original. No se multiplica ni reescribe dinero antiguo. La moneda configurable, múltiples listas de precio, impuestos y descuentos avanzados siguen siendo trabajo posterior.

## Correcciones del POS de restaurante

1. La confirmación agrega todos los requisitos de insumos, incluyendo platos que comparten receta/ingredientes, y valida el carrito completo antes de escribir.
2. Cada checkout de la pantalla tiene una clave de idempotencia. Reintentar la misma confirmación devuelve su venta original. Cada descuento usa una actualización condicionada por stock suficiente. Venta, líneas, movimientos, alertas y comandas se confirman en la misma transacción.
3. La cancelación restaura el consumo histórico de `inventory_movements`, en lugar de volver a leer la receta vigente. Cambiar una receta no altera lo que se reintegra.
4. Si ya comenzó la preparación, cancelar el cobro no devuelve automáticamente los insumos consumidos. El motivo queda registrado en la alerta. Para ventas antiguas sin comandas se conserva la reversión histórica de movimientos disponible.
5. Los cambios de estado de comanda pueden verificar el estado esperado para evitar avanzar dos veces desde una vista desactualizada.
6. Se retiró la eliminación automática de supuestos productos demo por nombre al abrir la base.

El inventario de restaurante aún usa REAL porque sus datos/contratos se preservan. Su conversión a cantidades exactas, recetas versionadas y escandallo de costes debe ejecutarse en una migración específica después de conciliar la operación real.

## Migración y backups

- Se rechaza una versión de base superior a la soportada antes de modificarla.
- El DDL v4 es aditivo e idempotente; escribir la versión y crear las nuevas estructuras ocurre dentro de una transacción.
- No se inventan artículos genéricos a partir de platos ni se reclasifica el rubro instalado; el restaurante es el punto de partida conservado.
- La restauración valida integridad y relaciones y migra la base de staging antes de copiarla sobre el destino. Después elimina sesiones y exige iniciar sesión de nuevo, recargando también el perfil de negocio restaurado.
- El archivo `database/pos.db` versionado no se abrió para escritura ni se migró durante el desarrollo. La actualización se ejecuta cuando se abre la aplicación.
- Restaurar un backup previo al piloto perdería las operaciones posteriores: conservar backups recientes y conciliar las ventas nuevas antes de cualquier rollback. No hay downgrade automático de v4 a v3.

## Límites actuales y siguientes etapas

Esta entrega implementa operaciones **locales** para los cinco tipos. No equivale a todas las integraciones y reglas avanzadas de sus rubros.

| Siguiente etapa | Trabajo necesario | Criterio de salida |
| --- | --- | --- |
| Piloto en dispositivo | Probar onboarding, caja, reservas, citas, backup/restauración y comandas con datos representativos | Mismos totales, stock y estados tras cerrar/reabrir y restaurar; sin duplicar efectos. |
| Inventario avanzado | Varios lotes por SKU, FEFO, ubicaciones, coste, umbrales por lote y variantes estructuradas | Una venta asigna lotes disponibles sin mezclar stock vencido. Actualmente hay un lote por registro/SKU. |
| Producción avanzada | Versionado de recetas, rendimiento, merma, apartados y coste/escandallo | Preparación usa su versión congelada y se puede conciliar el margen por receta. |
| Operación temporal avanzada | Horarios y ausencias del personal, recursos con capacidad, buffers, prórrogas y reprogramación | Citas y alquileres respetan restricciones y mantienen el historial de cambios. Actualmente reservas/citas se crean y cierran; cambios de horario requieren cancelar antes de ejecutar y registrar de nuevo. |
| Hardware | Adaptadores según modelo/protocolo de báscula, lector e impresora | Lectura estable, unidad y tara verificadas con el dispositivo real. Actualmente medida y búsqueda de código se ingresan en la app. |
| Digital y recurrencia automatizados | Proveedor de pago, tokenización, webhooks, outbox y plataforma de acceso | Reintentos sin doble cobro y concesión/revocación efectiva del acceso. Actualmente cobro, entrega y revocación son registros manuales; un código local no bloquea un enlace externo. |
| Varias cajas/KDS remoto | Backend autoritativo, sincronización, permisos y resolución de conflictos | Dos dispositivos no sobrevenden ni reservan el mismo recurso. Hoy el calendario y las comandas pertenecen a una base local. |
| Gestión de negocios | Crear/abrir otra base independiente y migrar cuando proceda | Cada negocio tiene un tipo y sus datos propios; seleccionar otro nunca mezcla ni elimina la base activa. |

Los alquileres por mes y los ciclos de suscripción usan meses de calendario, ajustando días inexistentes al final del mes. Las tarifas por día de alquiler usan periodos de 24 horas. Las citas y la presentación de fechas usan la zona local del dispositivo; configurar una zona comercial independiente es otra etapa antes de operación distribuida.

## Comprobaciones reproducibles

Requiere Node 22.14 o posterior para el runner con SQLite incorporado (Expo conserva sus requisitos propios).

- `npm test`: ejecuta los repositorios/migrador TypeScript reales contra SQLite en memoria, sustituyendo únicamente APIs de dispositivo. Cubre selección exclusiva, actualización de bases, stock agregado, precisión, idempotencia, vencimientos, reservas/citas concurrentes, garantías, acceso/suscripción y consumo/cancelación del restaurante.
- `npm run typecheck`: verifica tipos, contratos y rutas de la app. Si los tipos de rutas estaban generados antes de añadir pantallas, iniciar Expo para regenerarlos.
- `npm run lint`: análisis estático. Las advertencias heredadas se reportan por separado de errores nuevos.
- `npx expo export --platform web --output-dir /tmp/emprender-multirubro-export`: comprueba el bundle y la renderización estática.

Estas pruebas no sustituyen el piloto en Android/iOS ni la comprobación del hardware y proveedores externos. La configuración WASM/SharedArrayBuffer de SQLite web debe verificarse también en el servidor que sirva la aplicación.
