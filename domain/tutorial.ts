import type { BusinessModel } from './business';

export type TutorialTarget = 'settings' | 'menu' | 'inventory' | 'operations' | 'sales';
export type TutorialStep = { target: TutorialTarget; title: string; description: string };
const step = (target: TutorialTarget, title: string, description: string): TutorialStep => ({ target, title, description });
const settings = step('settings', 'Tu emprendimiento está listo', 'Aquí puedes revisar el nombre y tipo de negocio, cambiar el tema, configurar tu seguridad y exportar una copia de tus datos. Este recorrido te muestra qué configurar primero.');
const finish = step('settings', 'Vuelve cuando lo necesites', 'Ya conoces el orden para comenzar. Abre el menú lateral y elige Tutorial para repetir esta guía. Al finalizar podrás configurar tus datos a tu ritmo.');

export const BUSINESS_TUTORIALS: Record<BusinessModel, readonly TutorialStep[]> = {
  restaurant: [
    step('settings', 'Organiza tus categorías', 'En Configuración, abre Categorías de productos e insumos. Crea grupos para tus platos e ingredientes antes de llenar el menú.'),
    step('inventory', 'Registra tus insumos', 'Usa Nuevo insumo para registrar ingredientes, unidades y mínimos de stock. En Entrada registra las compras y sus cantidades; en Salida, las mermas o consumos adicionales.'),
    step('menu', 'Crea el menú y las recetas', 'Pulsa Crear nuevo plato. Define su categoría y precio, y agrega los ingredientes de la receta con sus cantidades para calcular costos y descontar insumos al vender.'),
    step('sales', 'Registra una venta', 'Agrega los platos, elige mesa, retiro o domicilio y registra el pago. Antes de confirmar revisa cantidades, disponibilidad y total.'),
    step('operations', 'Revisa la preparación', 'En Preparación consulta los pedidos y actualiza su estado a medida que los preparas y entregas.'), finish,
  ],
  retail: [settings,
    step('menu', 'Crea tus productos', 'Pulsa Crear producto. Define nombre, categoría, SKU obligatorio y precio por unidad. Puedes incluir código de barras, variante, lote y vencimiento.'),
    step('inventory', 'Configura las existencias', 'Registra el stock inicial y el mínimo de cada producto. Usa Ajustar existencias para corregir cantidades y revisa Movimientos para consultar su historial.'),
    step('sales', 'Realiza tu primera venta', 'Agrega productos y cantidades al carrito. Selecciona efectivo o transferencia e ingresa el monto recibido; al confirmar se descuenta el inventario.'), finish,
  ],
  measured: [settings,
    step('menu', 'Define productos y unidades', 'Pulsa Crear producto. Para granel elige ml, lt, g, kg o m y define el precio por esa unidad. Registra los empaques como artículos separados por unidad.'),
    step('inventory', 'Carga el stock y sus mínimos', 'Ingresa las existencias en la unidad del producto y configura el mínimo de stock. Usa Ajustar existencias para registrar correcciones.'),
    step('sales', 'Vende cantidades medidas', 'Agrega la cantidad de peso, volumen o longitud que vendes. Puedes usar unidades compatibles; el total se calcula proporcionalmente. Agrega el empaque si lo cobras por separado.'), finish,
  ],
  rental: [settings,
    step('menu', 'Registra cada activo', 'Pulsa Registrar activo. Define nombre, categoría, tarifa por hora, día o mes y garantía. Registra cada activo que quieras reservar de forma independiente.'),
    step('inventory', 'Revisa la disponibilidad', 'Consulta los activos operativos y marca Mantenimiento cuando corresponda. El calendario de Reservas te permite revisar los periodos ocupados.'),
    step('sales', 'Crea una reserva', 'Selecciona el activo, el cliente y las fechas de entrega y devolución. Revisa la tarifa del periodo, la garantía y el monto recibido antes de confirmar.'),
    step('operations', 'Controla entregas y devoluciones', 'En Reservas registra la entrega del activo. Al devolverlo, registra la inspección y la garantía devuelta; explica cualquier retención.'), finish,
  ],
  services: [settings,
    step('menu', 'Crea servicios, contenido o planes', 'Usa Crear servicio, contenido o plan. Configura el precio y, según el tipo, la duración de la cita, el enlace del contenido digital o los meses de la suscripción.'),
    step('operations', 'Registra tus profesionales', 'En Agenda y accesos, escribe el nombre del profesional y pulsa Agregar profesional. Los servicios con cita necesitan personal para poder asignarlos.'),
    step('sales', 'Agenda o vende un acceso', 'Elige el servicio o plan y registra al cliente. Para una cita selecciona profesional y fecha; para contenido digital o suscripciones confirma el pago para generar su registro.'),
    step('operations', 'Gestiona citas y accesos', 'Marca servicios realizados, comparte y registra entregas digitales, y registra manualmente los cobros de renovación. Si usas una plataforma externa, administra allí los permisos del contenido.'), finish,
  ],
};
