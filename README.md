# Emprender — POS para cinco tipos de emprendimiento

Aplicación Expo SDK 57, React Native y SQLite. Cada negocio elige **un solo tipo** antes de entrar al POS: restaurante/preparación, alquiler, venta por medida, retail o servicios/contenido digital.

El restaurante conserva el POS, los datos y las rutas existentes. Las otras modalidades tienen catálogo, venta, inventario u operación y reportes propios. La selección se guarda con la base de datos; no se mezclan modelos ni se permite cambiar el tipo de un negocio con información.

## Desarrollo

```sh
npm install
npm start
```

Usar Expo Go o un development build compatible con SDK 57. Después de actualizar dependencias, detener los servidores Expo anteriores y ejecutar `npx expo start --clear`. También están disponibles `npm run android`, `npm run ios` y `npm run web`. El servidor de desarrollo agrega las cabeceras necesarias para SQLite web; un servidor de exportación estática debe configurar COOP `same-origin` y COEP `require-corp`.

Al abrir por primera vez: crear/iniciar sesión → dar nombre al negocio → seleccionar tipo → registrar catálogo → operar. Si la base contiene información de restaurante, el selector conserva ese modo. Los backups se exportan/restauran desde Configuración y contienen también el perfil del negocio.

## Verificación

Para el runner de pruebas usar Node 22.14 o posterior, con SQLite incorporado.

```sh
npm test
npm run typecheck
npm run lint
npx expo export --platform web --output-dir /tmp/emprender-web
```

Si TypeScript conserva tipos de rutas antiguos, iniciar Expo para regenerar `.expo/types`.

Las pruebas usan SQLite en memoria y los repositorios/migraciones reales; no escriben en `database/pos.db`. La migración aditiva a v4 se ejecuta al abrir la app. `database/schema.sql` sigue siendo el bootstrap legado v3; `database/business-schema.ts` define la ampliación v4. `npm run db:reference` regenera el SQL documentado desde esa fuente.

## Alcance

La operación actual es local. Granel recibe cantidad/tara desde la app; alquileres y citas rechazan solapamientos en esta base; las suscripciones se renuevan al registrar un cobro manual. Compartir contenido y registrar su entrega/revocación no modifica permisos de una plataforma externa. Cobros automáticos, básculas, varias cajas, KDS remoto y control de acceso externo requieren sus respectivas integraciones.

El [diseño y roadmap actualizado](docs/architecture/multirubro.md) documenta entidades, flujos, reglas, límites de la primera implementación y siguientes etapas.

## APK de prueba

```sh
npx eas-cli build --platform android --profile preview
```

Requiere la cuenta/configuración EAS del proyecto. No se generó ni publicó un APK durante esta reestructuración.
