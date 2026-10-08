import * as Crypto from "expo-crypto";
import { getDatabase } from "./auth-database";
import { withPosTransaction as transaction, serializeDatabase as serialized, type DatabaseExecutor as Executor } from "./unit-of-work";
import { addCalendarMonths, isBusinessModel, lineAmount, MODEL_KINDS, quantityAtoms, rentalPeriods, UNITS, type BusinessModel, type BusinessProfile, type OfferingKind, type Unit } from "../domain/business";

async function profile(tx: Executor): Promise<BusinessProfile> {
  const row = await tx.getFirstAsync<BusinessProfile>("SELECT name,model FROM business_profile WHERE id=1");
  if (!row || !isBusinessModel(row.model)) throw new Error("Selecciona primero tu tipo de emprendimiento.");
  return row;
}
async function commerceProfile(tx: Executor) {
  const business = await profile(tx);
  if (business.model === "restaurant") throw new Error("Esta operación pertenece a otro tipo de emprendimiento.");
  return business as BusinessProfile & { model: Exclude<BusinessModel, "restaurant"> };
}
function integer(value: number, label: string, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${label}: valor inválido.`);
  return value;
}
export async function getBusinessProfile() {
  return serialized(async () => (await getDatabase()).getFirstAsync<BusinessProfile>("SELECT name,model FROM business_profile WHERE id=1"));
}
export async function hasRestaurantData() {
  return serialized(async () => {
    const row = await (await getDatabase()).getFirstAsync<{ count: number }>("SELECT (SELECT COUNT(*) FROM dishes)+(SELECT COUNT(*) FROM inventory_items)+(SELECT COUNT(*) FROM sales) AS count");
    return Boolean(row?.count);
  });
}
export async function selectBusiness(input: BusinessProfile) {
  if (!input.name.trim() || !isBusinessModel(input.model)) throw new Error("Ingresa el nombre y elige un tipo de emprendimiento.");
  await transaction(async (tx) => {
    const existing = await tx.getFirstAsync<BusinessProfile>("SELECT name,model FROM business_profile WHERE id=1");
    if (existing) {
      if (existing.model !== input.model) throw new Error("Este negocio ya tiene un tipo seleccionado. No es posible mezclar su operación con otro tipo.");
      return;
    }
    const legacy = await tx.getFirstAsync<{ count: number }>("SELECT (SELECT COUNT(*) FROM dishes)+(SELECT COUNT(*) FROM inventory_items)+(SELECT COUNT(*) FROM sales) AS count");
    if (legacy?.count && input.model !== "restaurant") throw new Error("Esta base contiene operaciones de restaurante. Selecciona restaurante para conservarlas.");
    await tx.runAsync("INSERT INTO business_profile(id,name,model,created_at) VALUES(1,?,?,?)", [input.name.trim(), input.model, Date.now()]);
  });
}
export type Offering = {
  id: number; name: string; category: string; kind: OfferingKind; sku: string | null; barcode: string | null;
  variant_label: string; unit: Unit; price_minor: number; stock_atoms: number; low_stock_atoms: number;
  lot_code: string | null; expires_at: number | null; active: number; condition: "usable" | "maintenance";
  rate_period: "hour" | "day" | "month"; deposit_minor: number; duration_minutes: number;
  subscription_months: number; digital_url: string | null;
};
export type OfferingInput = Omit<Offering, "id" | "active" | "condition"> & { id?: number };
export async function getOfferings(search = "", includeInactive = false) {
  return serialized(async () => {
    const db = await getDatabase();
    await commerceProfile(db);
    return db.getAllAsync<Offering>(`SELECT * FROM business_offerings WHERE (?=1 OR active=1)
      AND (name LIKE ? OR COALESCE(sku,'') LIKE ? OR COALESCE(barcode,'') LIKE ? OR variant_label LIKE ?) ORDER BY name,variant_label`,
    [includeInactive ? 1 : 0, ...Array(4).fill(`%${search.trim()}%`)]);
  });
}
export async function saveOffering(input: OfferingInput) {
  return transaction(async (tx) => {
    const business = await commerceProfile(tx);
    if (!MODEL_KINDS[business.model].includes(input.kind) || !input.name.trim() || !input.category.trim()) throw new Error("El artículo no es válido para este emprendimiento.");
    if (!Object.hasOwn(UNITS, input.unit)) throw new Error("Unidad inválida.");
    if ((business.model !== "measured" || input.kind === "packaging") && input.unit !== "und") throw new Error("Este artículo se opera por unidad.");
    if (business.model === "measured" && input.kind === "product" && input.unit === "und") throw new Error("El producto a granel requiere unidad de peso, volumen o longitud.");
    for (const key of ["price_minor", "stock_atoms", "low_stock_atoms", "deposit_minor"] as const) integer(input[key], key);
    if (input.unit === "und" && input.stock_atoms % UNITS.und.atoms !== 0) throw new Error("El stock por pieza debe ser entero.");
    integer(input.duration_minutes, "Duración", 1); integer(input.subscription_months, "Periodo", 1);
    if (!['hour','day','month'].includes(input.rate_period)) throw new Error("Periodo inválido.");
    if (input.expires_at !== null) integer(input.expires_at, "Vencimiento", 1);
    if (input.digital_url && !/^https?:\/\//i.test(input.digital_url)) throw new Error("El enlace debe comenzar con https:// o http://.");
    if (business.model === "retail" && !input.sku?.trim()) throw new Error("El SKU es obligatorio.");
    const physical = input.kind === "product" || input.kind === "packaging";
    const stock = physical ? input.stock_atoms : 0;
    const now = Date.now();
    const existing = input.id ? await tx.getFirstAsync<Offering>("SELECT * FROM business_offerings WHERE id=?", [input.id]) : null;
    if (input.id && !existing) throw new Error("No encontramos el artículo.");
    if (existing && (existing.kind !== input.kind || existing.unit !== input.unit)) throw new Error("El tipo y la unidad del artículo no se pueden cambiar. Crea otro artículo.");
    const fields = [input.name.trim(), input.category.trim(), input.kind, input.sku?.trim() || null, input.barcode?.trim() || null,
      input.variant_label.trim(), input.unit, input.price_minor, stock, input.low_stock_atoms, input.lot_code?.trim() || null,
      input.expires_at, input.rate_period, input.deposit_minor, input.duration_minutes, input.subscription_months, input.digital_url?.trim() || null, now];
    let id = input.id ?? 0;
    if (existing) {
      await tx.runAsync(`UPDATE business_offerings SET name=?,category=?,kind=?,sku=?,barcode=?,variant_label=?,unit=?,price_minor=?,stock_atoms=?,low_stock_atoms=?,lot_code=?,expires_at=?,rate_period=?,deposit_minor=?,duration_minutes=?,subscription_months=?,digital_url=?,updated_at=? WHERE id=?`, [...fields, id]);
    } else {
      const result = await tx.runAsync(`INSERT INTO business_offerings(name,category,kind,sku,barcode,variant_label,unit,price_minor,stock_atoms,low_stock_atoms,lot_code,expires_at,rate_period,deposit_minor,duration_minutes,subscription_months,digital_url,updated_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [...fields, now]);
      id = result.lastInsertRowId;
    }
    if (stock !== (existing?.stock_atoms ?? 0)) await tx.runAsync("INSERT INTO business_stock_movements(offering_id,delta_atoms,reason,created_at) VALUES(?,?,?,?)", [id, stock - (existing?.stock_atoms ?? 0), existing ? "Ajuste de inventario" : "Stock inicial", now]);
    return id;
  });
}
export async function setOfferingActive(id: number, active: boolean) {
  await transaction(async (tx) => {
    await commerceProfile(tx);
    await tx.runAsync("UPDATE business_offerings SET active=?,updated_at=? WHERE id=?", [active ? 1 : 0, Date.now(), id]);
  });
}
export async function setAssetCondition(id: number, condition: "usable" | "maintenance") {
  await transaction(async (tx) => {
    if ((await commerceProfile(tx)).model !== "rental") throw new Error("Operación exclusiva de alquileres.");
    const busy = await tx.getFirstAsync<{ id: number }>("SELECT id FROM business_bookings WHERE offering_id=? AND state IN ('reserved','delivered') LIMIT 1", [id]);
    if (busy && condition === "maintenance") throw new Error("Primero cierra o cancela las reservas activas del activo.");
    await tx.runAsync("UPDATE business_offerings SET condition=?,updated_at=? WHERE id=? AND kind='asset'", [condition, Date.now(), id]);
  });
}
export type Staff = { id: number; name: string };
export async function getStaff() {
  return serialized(async () => (await getDatabase()).getAllAsync<Staff>("SELECT id,name FROM business_staff WHERE active=1 ORDER BY name"));
}
export async function addStaff(name: string) {
  if (!name.trim()) throw new Error("Ingresa el nombre del profesional.");
  await transaction(async (tx) => {
    if ((await commerceProfile(tx)).model !== "services") throw new Error("Operación exclusiva de servicios.");
    await tx.runAsync("INSERT INTO business_staff(name) VALUES(?)", [name.trim()]);
  });
}
export type SaleLineInput = { offeringId: number; quantity: string; unit?: Unit; startsAt?: number; endsAt?: number; staffId?: number; expectedPriceMinor?: number; expectedDepositMinor?: number; expectedPeriod?: string; expectedDurationMinutes?: number };
export type BusinessSaleInput = { operationKey: string; customerName: string; paymentMethod: "Efectivo" | "Transferencia"; receivedMinor: number; lines: SaleLineInput[] };
export async function createBusinessSale(input: BusinessSaleInput) {
  return transaction(async (tx) => {
    const business = await commerceProfile(tx);
    if (!input.operationKey.trim()) throw new Error("Falta la referencia de la operación.");
    const retry = await tx.getFirstAsync<{ id: number }>("SELECT id FROM business_orders WHERE operation_key=?", [input.operationKey]);
    if (retry) return retry.id;
    if (!input.lines.length) throw new Error("Agrega al menos un artículo.");
    if (input.paymentMethod !== "Efectivo" && input.paymentMethod !== "Transferencia") throw new Error("Método de pago inválido.");
    integer(input.receivedMinor, "Monto recibido");
    const prepared: { offering: Offering; atoms: number; basis: number; total: number; line: SaleLineInput }[] = [];
    const demand = new Map<number, number>();
    let subtotal = 0, deposit = 0;
    for (const original of input.lines) {
      const line = { ...original };
      const offering = await tx.getFirstAsync<Offering>("SELECT * FROM business_offerings WHERE id=? AND active=1", [line.offeringId]);
      if (!offering || !MODEL_KINDS[business.model].includes(offering.kind)) throw new Error("El artículo no pertenece a este emprendimiento o está inactivo.");
      if ((line.expectedPriceMinor !== undefined && line.expectedPriceMinor !== offering.price_minor) ||
          (line.expectedDepositMinor !== undefined && line.expectedDepositMinor !== offering.deposit_minor) ||
          (line.expectedPeriod !== undefined && line.expectedPeriod !== offering.rate_period) ||
          (line.expectedDurationMinutes !== undefined && line.expectedDurationMinutes !== offering.duration_minutes)) throw new Error("El precio o las condiciones cambiaron. Actualiza el catálogo y vuelve a agregar el artículo.");
      const unit = line.unit ?? offering.unit;
      if (!Object.hasOwn(UNITS, unit) || UNITS[unit].dimension !== UNITS[offering.unit].dimension) throw new Error("La unidad de venta no es compatible.");
      const atoms = quantityAtoms(line.quantity, unit);
      if (atoms <= 0) throw new Error("La cantidad debe ser mayor a cero.");
      const basis = UNITS[offering.unit].atoms;
      let total = lineAmount(atoms, offering.price_minor, basis);
      if (offering.kind === "product" || offering.kind === "packaging") {
        if (offering.expires_at && offering.expires_at <= Date.now()) throw new Error(`${offering.name}: lote vencido.`);
        const required = (demand.get(offering.id) ?? 0) + atoms;
        integer(required, "Demanda"); demand.set(offering.id, required);
        if (required > offering.stock_atoms) throw new Error(`${offering.name}: stock insuficiente para todo el carrito.`);
      } else {
        if (atoms !== UNITS.und.atoms) throw new Error("Cada reserva, servicio o acceso se registra en una línea individual.");
        if (!input.customerName.trim()) throw new Error("El nombre del cliente es obligatorio para esta operación.");
      }
      if (offering.kind === "asset" || offering.kind === "service") {
        integer(line.startsAt ?? 0, "Inicio", 1);
        if ((line.startsAt ?? 0) < Date.now() - 60_000) throw new Error("La reserva o cita debe comenzar en una fecha actual o futura.");
        if (offering.kind === "asset") {
          if (line.staffId !== undefined) throw new Error("Un alquiler se asigna a un activo, no a un profesional.");
          if (offering.condition !== "usable") throw new Error("El activo está en mantenimiento.");
          const count = rentalPeriods(line.startsAt!, line.endsAt!, offering.rate_period);
          total = integer(count * offering.price_minor, "Total de alquiler");
          deposit = integer(deposit + offering.deposit_minor, "Garantías");
        } else {
          const staff = await tx.getFirstAsync<Staff>("SELECT id,name FROM business_staff WHERE id=? AND active=1", [line.staffId ?? 0]);
          if (!staff) throw new Error("Selecciona un profesional para la cita.");
          line.endsAt = integer(line.startsAt! + offering.duration_minutes * 60_000, "Fin de cita", 1);
        }
      }
      subtotal = integer(subtotal + total, "Total de venta");
      prepared.push({ offering, atoms, basis, total, line: { ...line } });
    }
    const payable = integer(subtotal + deposit, "Total a cobrar");
    if (input.receivedMinor < payable) throw new Error("El monto recibido no cubre la venta y las garantías.");
    const now = Date.now();
    const order = await tx.runAsync("INSERT INTO business_orders(operation_key,customer_name,model,payment_method,total_minor,deposit_minor,amount_received_minor,created_at) VALUES(?,?,?,?,?,?,?,?)", [input.operationKey, input.customerName.trim(), business.model, input.paymentMethod, subtotal, deposit, input.receivedMinor, now]);
    const orderId = order.lastInsertRowId;
    for (const row of prepared) {
      const { offering, line } = row;
      const saved = await tx.runAsync("INSERT INTO business_order_lines(order_id,offering_id,name_snapshot,category_snapshot,unit_snapshot,quantity_atoms,price_minor,price_basis_atoms,total_minor) VALUES(?,?,?,?,?,?,?,?,?)", [orderId, offering.id, [offering.name, offering.variant_label].filter(Boolean).join(" · "), offering.category, offering.unit, row.atoms, offering.price_minor, row.basis, row.total]);
      if (demand.has(offering.id)) {
        const changed = await tx.runAsync("UPDATE business_offerings SET stock_atoms=stock_atoms-?,updated_at=? WHERE id=? AND stock_atoms>=?", [row.atoms, now, offering.id, row.atoms]);
        if (changed.changes !== 1) throw new Error("El stock cambió mientras confirmabas la venta.");
        await tx.runAsync("INSERT INTO business_stock_movements(offering_id,order_id,delta_atoms,reason,created_at) VALUES(?,?,?,?,?)", [offering.id, orderId, -row.atoms, "Venta", now]);
      }
      if (offering.kind === "asset" || offering.kind === "service") await tx.runAsync("INSERT INTO business_bookings(line_id,offering_id,staff_id,starts_at,ends_at,deposit_minor) VALUES(?,?,?,?,?,?)", [saved.lastInsertRowId, offering.id, line.staffId ?? null, line.startsAt!, line.endsAt!, offering.kind === "asset" ? offering.deposit_minor : 0]);
      if (offering.kind === "digital") await tx.runAsync("INSERT INTO business_accesses(line_id,access_code,url_snapshot) VALUES(?,?,?)", [saved.lastInsertRowId, Crypto.randomUUID(), offering.digital_url]);
      if (offering.kind === "subscription") await tx.runAsync("INSERT INTO business_subscriptions(offering_id,initial_line_id,customer_name,price_minor,months,next_due_at) VALUES(?,?,?,?,?,?)", [offering.id, saved.lastInsertRowId, input.customerName.trim(), offering.price_minor, offering.subscription_months, addCalendarMonths(now, offering.subscription_months)]);
    }
    return orderId;
  });
}
export type BusinessOrder = { id: number; customer_name: string; total_minor: number; deposit_minor: number; amount_received_minor: number; status: "completed" | "cancelled"; created_at: number; payment_method: string };
export async function getBusinessOrders() {
  return serialized(async () => {
    const db = await getDatabase(); await commerceProfile(db);
    return db.getAllAsync<BusinessOrder>("SELECT * FROM business_orders ORDER BY created_at DESC LIMIT 100");
  });
}
export async function getBusinessSummary() {
  return serialized(async () => {
    const db = await getDatabase(); await commerceProfile(db);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const all = await db.getFirstAsync<{ revenue: number; count: number }>("SELECT COALESCE(SUM(total_minor),0) AS revenue,COUNT(*) AS count FROM business_orders WHERE status='completed'");
    const today = await db.getFirstAsync<{ revenue: number; count: number }>("SELECT COALESCE(SUM(total_minor),0) AS revenue,COUNT(*) AS count FROM business_orders WHERE status='completed' AND created_at>=? AND created_at<?", [start.getTime(), end.getTime()]);
    const categories = await db.getAllAsync<{ category: string; revenue: number }>("SELECT l.category_snapshot AS category,SUM(l.total_minor) AS revenue FROM business_order_lines l JOIN business_orders o ON o.id=l.order_id WHERE o.status='completed' GROUP BY l.category_snapshot ORDER BY revenue DESC");
    const guarantees = await db.getFirstAsync<{ outstanding: number; refunded: number; retained: number }>("SELECT COALESCE(SUM(deposit_minor-refunded_minor-retained_minor),0) AS outstanding,COALESCE(SUM(refunded_minor),0) AS refunded,COALESCE(SUM(retained_minor),0) AS retained FROM business_bookings");
    return { all: all!, today: today!, categories, guarantees: guarantees! };
  });
}
export async function getBusinessOrderDetail(id: number) {
  return serialized(async () => {
    const db = await getDatabase(); await commerceProfile(db);
    const order = await db.getFirstAsync<BusinessOrder>("SELECT * FROM business_orders WHERE id=?", [id]);
    const lines = await db.getAllAsync<{ id: number; name_snapshot: string; unit_snapshot: Unit; quantity_atoms: number; total_minor: number }>("SELECT * FROM business_order_lines WHERE order_id=?", [id]);
    return { order, lines };
  });
}
export async function cancelBusinessOrder(id: number, reason: string) {
  if (!reason.trim()) throw new Error("Ingresa un motivo de cancelación.");
  await transaction(async (tx) => {
    await commerceProfile(tx);
    const order = await tx.getFirstAsync<BusinessOrder>("SELECT * FROM business_orders WHERE id=?", [id]);
    if (!order || order.status === "cancelled") throw new Error("Esta venta ya está cancelada o no existe.");
    const executed = await tx.getFirstAsync<{ id: number }>("SELECT b.id FROM business_bookings b JOIN business_order_lines l ON l.id=b.line_id WHERE l.order_id=? AND b.state NOT IN ('reserved','cancelled') LIMIT 1", [id]);
    if (executed) throw new Error("Esta operación ya fue ejecutada. Gestiona la devolución desde Reservas o Agenda.");
    const renewed = await tx.getFirstAsync<{ id: number }>(`SELECT c.order_id AS id FROM business_subscription_cycles c LEFT JOIN business_subscriptions s ON s.id=c.subscription_id LEFT JOIN business_order_lines l ON l.id=s.initial_line_id WHERE c.order_id=? OR l.order_id=? LIMIT 1`, [id, id]);
    if (renewed) throw new Error("La suscripción tiene renovaciones. Cancélala desde Agenda y accesos; no se revierten ciclos cobrados automáticamente.");
    const movements = await tx.getAllAsync<{ offering_id: number; delta_atoms: number }>("SELECT offering_id,delta_atoms FROM business_stock_movements WHERE order_id=? AND delta_atoms<0", [id]);
    for (const movement of movements) {
      await tx.runAsync("UPDATE business_offerings SET stock_atoms=stock_atoms+?,updated_at=? WHERE id=?", [-movement.delta_atoms, Date.now(), movement.offering_id]);
      await tx.runAsync("INSERT INTO business_stock_movements(offering_id,order_id,delta_atoms,reason,created_at) VALUES(?,?,?,?,?)", [movement.offering_id, id, -movement.delta_atoms, reason.trim(), Date.now()]);
    }
    await tx.runAsync("UPDATE business_bookings SET state='cancelled',refunded_minor=deposit_minor WHERE line_id IN (SELECT id FROM business_order_lines WHERE order_id=?)", [id]);
    await tx.runAsync("UPDATE business_accesses SET state='revoked' WHERE line_id IN (SELECT id FROM business_order_lines WHERE order_id=?)", [id]);
    await tx.runAsync("UPDATE business_subscriptions SET state='cancelled' WHERE initial_line_id IN (SELECT id FROM business_order_lines WHERE order_id=?)", [id]);
    await tx.runAsync("UPDATE business_orders SET status='cancelled',cancellation_reason=? WHERE id=?", [reason.trim(), id]);
  });
}
export type Booking = { id: number; name: string; customer_name: string; staff_name: string | null; starts_at: number; ends_at: number; state: string; deposit_minor: number; refunded_minor: number; retained_minor: number; kind: OfferingKind };
export type Access = { id: number; name: string; customer_name: string; access_code: string; url_snapshot: string | null; state: string };
export type Subscription = { id: number; name: string; customer_name: string; price_minor: number; next_due_at: number; state: string };
export async function getOperations() {
  return serialized(async () => {
    const db = await getDatabase(); await commerceProfile(db);
    const bookings = await db.getAllAsync<Booking>(`SELECT b.*,l.name_snapshot AS name,o.customer_name,s.name AS staff_name,p.kind FROM business_bookings b JOIN business_order_lines l ON l.id=b.line_id JOIN business_orders o ON o.id=l.order_id JOIN business_offerings p ON p.id=b.offering_id LEFT JOIN business_staff s ON s.id=b.staff_id ORDER BY b.starts_at DESC`);
    const accesses = await db.getAllAsync<Access>(`SELECT a.*,l.name_snapshot AS name,o.customer_name FROM business_accesses a JOIN business_order_lines l ON l.id=a.line_id JOIN business_orders o ON o.id=l.order_id ORDER BY a.id DESC`);
    const subscriptions = await db.getAllAsync<Subscription>(`SELECT s.*,p.name FROM business_subscriptions s JOIN business_offerings p ON p.id=s.offering_id ORDER BY s.next_due_at`);
    const movements = await db.getAllAsync<{ id: number; name: string; unit: Unit; delta_atoms: number; reason: string; created_at: number }>(`SELECT m.*,p.name,p.unit FROM business_stock_movements m JOIN business_offerings p ON p.id=m.offering_id ORDER BY m.id DESC LIMIT 100`);
    return { bookings, accesses, subscriptions, movements };
  });
}
export async function updateBooking(id: number, state: "delivered" | "returned" | "completed", refundedMinor = 0, notes = "") {
  await transaction(async (tx) => {
    const business = await commerceProfile(tx);
    const row = await tx.getFirstAsync<Booking>("SELECT b.*,p.kind FROM business_bookings b JOIN business_offerings p ON p.id=b.offering_id WHERE b.id=?", [id]);
    if (!row || (business.model === "rental" ? row.kind !== "asset" : business.model !== "services" || row.kind !== "service")) throw new Error("Operación no disponible.");
    if (row.kind === "service") {
      if (row.state !== "reserved" || state !== "completed") throw new Error("La cita ya está cerrada.");
    } else if (!((row.state === "reserved" && state === "delivered") || (row.state === "delivered" && state === "returned"))) throw new Error("El cambio de estado no es válido.");
    if (state === "delivered") {
      const current = await tx.getFirstAsync<{ id: number }>("SELECT id FROM business_bookings WHERE offering_id=(SELECT offering_id FROM business_bookings WHERE id=?) AND id<>? AND state='delivered' LIMIT 1", [id, id]);
      if (current) throw new Error("El activo aún no ha sido devuelto de otro alquiler.");
    }
    if (state === "returned") {
      integer(refundedMinor, "Devolución de garantía");
      if (refundedMinor > row.deposit_minor) throw new Error("La devolución supera la garantía.");
      if (refundedMinor < row.deposit_minor && !notes.trim()) throw new Error("Describe el motivo de retención de la garantía.");
    }
    await tx.runAsync("UPDATE business_bookings SET state=?,refunded_minor=?,retained_minor=?,inspection_notes=? WHERE id=?", [state, state === "returned" ? refundedMinor : 0, state === "returned" ? row.deposit_minor - refundedMinor : 0, notes.trim(), id]);
  });
}
export async function updateAccess(id: number, state: "delivered" | "revoked") {
  await transaction(async (tx) => {
    if ((await commerceProfile(tx)).model !== "services") throw new Error("Operación exclusiva de servicios digitales.");
    const updated = await tx.runAsync("UPDATE business_accesses SET state=? WHERE id=? AND state='pending'", [state, id]);
    if (!updated.changes && state === "revoked") await tx.runAsync("UPDATE business_accesses SET state='revoked' WHERE id=? AND state='delivered'", [id]);
  });
}
export async function cancelSubscription(id: number) {
  await transaction(async (tx) => {
    if ((await commerceProfile(tx)).model !== "services") throw new Error("Operación exclusiva de suscripciones.");
    await tx.runAsync("UPDATE business_subscriptions SET state='cancelled' WHERE id=?", [id]);
  });
}
export async function renewSubscription(id: number, expectedDue: number, payment: "Efectivo" | "Transferencia") {
  return transaction(async (tx) => {
    if ((await commerceProfile(tx)).model !== "services") throw new Error("Operación exclusiva de suscripciones.");
    const previous = await tx.getFirstAsync<{ order_id: number }>("SELECT order_id FROM business_subscription_cycles WHERE subscription_id=? AND due_at=?", [id, expectedDue]);
    if (previous) return previous.order_id;
    const sub = await tx.getFirstAsync<{ offering_id: number; customer_name: string; price_minor: number; months: number; next_due_at: number; state: string }>("SELECT * FROM business_subscriptions WHERE id=?", [id]);
    if (!sub || sub.state !== "active" || sub.next_due_at !== expectedDue) throw new Error("La suscripción cambió o está cancelada. Actualiza la pantalla.");
    if (expectedDue > Date.now()) throw new Error("Todavía no vence este ciclo.");
    if (payment !== "Efectivo" && payment !== "Transferencia") throw new Error("Método de pago inválido.");
    const offering = await tx.getFirstAsync<Offering>("SELECT * FROM business_offerings WHERE id=?", [sub.offering_id]);
    if (!offering) throw new Error("No encontramos el plan.");
    const order = await tx.runAsync("INSERT INTO business_orders(operation_key,customer_name,model,payment_method,total_minor,amount_received_minor,created_at) VALUES(?,?,'services',?,?,?,?)", [`renew:${id}:${expectedDue}`, sub.customer_name, payment, sub.price_minor, sub.price_minor, Date.now()]);
    await tx.runAsync("INSERT INTO business_order_lines(order_id,offering_id,name_snapshot,category_snapshot,unit_snapshot,quantity_atoms,price_minor,price_basis_atoms,total_minor) VALUES(?,?,?,?,'und',1000000,?,1000000,?)", [order.lastInsertRowId, sub.offering_id, offering.name, offering.category, sub.price_minor, sub.price_minor]);
    await tx.runAsync("INSERT INTO business_subscription_cycles(subscription_id,due_at,order_id) VALUES(?,?,?)", [id, expectedDue, order.lastInsertRowId]);
    await tx.runAsync("UPDATE business_subscriptions SET next_due_at=? WHERE id=?", [addCalendarMonths(expectedDue, sub.months), id]);
    return order.lastInsertRowId;
  });
}
