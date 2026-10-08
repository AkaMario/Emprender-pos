export const BUSINESS_MODELS = {
  restaurant: { title: "Restaurante y preparación", description: "Platos, recetas, insumos y ventas por mesa, retiro o domicilio.", icon: "restaurant-menu", catalog: "Menú", inventory: "Insumos", operations: "Preparación" },
  rental: { title: "Alquiler y renta", description: "Activos, reservas por periodo, entregas, devoluciones y garantías.", icon: "event", catalog: "Activos", inventory: "Disponibilidad", operations: "Reservas" },
  measured: { title: "Granel, peso y volumen", description: "Perfumería, recargas y productos vendidos por ml, g, kg o metros.", icon: "straighten", catalog: "Productos y empaques", inventory: "Inventario", operations: "Movimientos" },
  retail: { title: "Comercio por unidad", description: "Productos por SKU, variantes, código de barras y vencimiento.", icon: "storefront", catalog: "Catálogo", inventory: "Inventario", operations: "Movimientos" },
  services: { title: "Servicios y contenido digital", description: "Servicios, citas, personal, entregas digitales y suscripciones.", icon: "work-outline", catalog: "Servicios y planes", inventory: "Agenda y accesos", operations: "Agenda y accesos" },
} as const;

export type BusinessModel = keyof typeof BUSINESS_MODELS;
export type BusinessProfile = { name: string; model: BusinessModel };
export function isBusinessModel(value: unknown): value is BusinessModel {
  return typeof value === "string" && Object.hasOwn(BUSINESS_MODELS, value);
}

export const UNITS = {
  und: { dimension: "count", atoms: 1_000_000 },
  ml: { dimension: "volume", atoms: 1_000_000 },
  lt: { dimension: "volume", atoms: 1_000_000_000 },
  g: { dimension: "mass", atoms: 1_000_000 },
  kg: { dimension: "mass", atoms: 1_000_000_000 },
  m: { dimension: "length", atoms: 1_000_000 },
} as const;
export type Unit = keyof typeof UNITS;
export type OfferingKind = "product" | "packaging" | "asset" | "service" | "digital" | "subscription";
export const MODEL_KINDS: Record<Exclude<BusinessModel, "restaurant">, readonly OfferingKind[]> = {
  measured: ["product", "packaging"], retail: ["product"], rental: ["asset"], services: ["service", "digital", "subscription"],
};
export const KIND_LABELS: Record<OfferingKind, string> = { product: "Producto", packaging: "Empaque", asset: "Activo", service: "Servicio", digital: "Contenido digital", subscription: "Suscripción" };

// Parse decimal strings without binary floating point multiplication.
export function scaledDecimal(value: string, scale: number, label = "Cantidad") {
  const match = /^(\d+)(?:[.,](\d+))?$/.exec(value.trim());
  if (!match) throw new Error(`${label}: ingresa un número positivo válido.`);
  const digits = match[2] ?? "";
  const numerator = BigInt(match[1] + digits) * BigInt(scale);
  const denominator = 10n ** BigInt(digits.length);
  if (numerator % denominator !== 0n) throw new Error(`${label}: demasiados decimales.`);
  const result = Number(numerator / denominator);
  if (!Number.isSafeInteger(result)) throw new Error(`${label}: valor demasiado grande.`);
  return result;
}
export function quantityAtoms(value: string, unit: Unit) {
  const atoms = scaledDecimal(value, UNITS[unit].atoms);
  if (UNITS[unit].dimension === "count" && atoms % 1_000_000 !== 0) throw new Error("Las piezas deben ser enteras.");
  return atoms;
}
export function moneyMinor(value: string) { return scaledDecimal(value, 100, "Precio"); }
export function lineAmount(quantity: number, price: number, basis: number) {
  if (![quantity, price, basis].every(Number.isSafeInteger) || quantity <= 0 || price < 0 || basis <= 0) throw new Error("Precio o cantidad inválidos.");
  const result = Number((BigInt(quantity) * BigInt(price) * 2n + BigInt(basis)) / (BigInt(basis) * 2n));
  if (!Number.isSafeInteger(result)) throw new Error("El total supera el límite permitido.");
  return result;
}
export function formatMoney(minor: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 }).format(minor / 100);
}
export function formatQuantity(atoms: number, unit: Unit) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 6 }).format(atoms / UNITS[unit].atoms);
}
export function decimalInput(value: number, scale: number) {
  if (!Number.isSafeInteger(value) || value < 0 || !Number.isSafeInteger(scale) || scale <= 0) throw new Error("Valor inválido.");
  const base = BigInt(scale), amount = BigInt(value);
  const decimals = String(scale).length - 1;
  const remainder = String(amount % base).padStart(decimals, "0").replace(/0+$/, "");
  return `${amount / base}${remainder ? `.${remainder}` : ""}`;
}
export function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("Usa fecha y hora con formato AAAA-MM-DD HH:mm.");
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) throw new Error("Fecha u hora inválida.");
  return date.getTime();
}
export function localDateInput(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function addCalendarMonths(timestamp: number, months: number) {
  const result = new Date(timestamp);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result.getTime();
}
export function rentalPeriods(start: number, end: number, period: "hour" | "day" | "month") {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end <= start) throw new Error("La devolución debe ser posterior a la entrega.");
  if (period !== "month") return Math.ceil((end - start) / (period === "hour" ? 3_600_000 : 86_400_000));
  const first = new Date(start), last = new Date(end);
  let months = (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth();
  months = Math.max(1, months);
  if (addCalendarMonths(start, months) < end) months += 1;
  return months;
}
