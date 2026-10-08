import { useFormProtection } from "@/hooks/use-form-protection";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import { getQrImageUri } from "@/database/pos-database";
import { useBusiness } from "@/context/business";
import { createBusinessSale, getOfferings, getStaff, type Offering, type SaleLineInput } from "@/database/business-database";
import { UNITS, decimalInput, formatMoney, lineAmount, localDateInput, moneyMinor, parseLocalDate, quantityAtoms, rentalPeriods, type Unit } from "@/domain/business";
import { Button, Card, Choices, Copy, ErrorText, Field, Heading, Page, errorMessage } from "./ui";
import { useBusinessQuery } from "./use-query";

type CartLine = { key: string; offering: Offering; input: SaleLineInput; total: number; deposit: number };
export function BusinessPos() {
  const { profile } = useBusiness(); const router = useRouter();
  const [search, setSearch] = useState("");
  const load = useCallback(async () => ({ offerings: await getOfferings(search), staff: await getStaff(), qr: await getQrImageUri() }), [search]);
  const { data, error, setError, loading } = useBusinessQuery(load, { offerings: [], staff: [], qr: null });
  const [selected, setSelected] = useState<Offering | null>(null);
  const [quantity, setQuantity] = useState("1"); const [unit, setUnit] = useState<Unit>("und");
  const [start, setStart] = useState(() => localDateInput(Date.now() + 3_600_000)); const [end, setEnd] = useState(() => localDateInput(Date.now() + 86_400_000)); const [staffId, setStaffId] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]); const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState<"Efectivo" | "Transferencia">("Efectivo"); const [received, setReceived] = useState("");
  const [saving, setSaving] = useState(false); const [customTare, setTare] = useState("0");
  const { dialog, markSaved } = useFormProtection([cart, customer, received], saving);
  const operation = useRef(Crypto.randomUUID());
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.total, 0), [cart]);
  const deposit = useMemo(() => cart.reduce((sum, line) => sum + line.deposit, 0), [cart]);
  let tender = 0;
  try { tender = moneyMinor(received || "0"); } catch { /* Validation message is shown on confirmation. */ }
  function select(offering: Offering) { setSelected(offering); setUnit(offering.unit); setQuantity("1"); setTare("0"); setError(""); }
  function add() {
    if (!selected) return;
    try {
      const input: SaleLineInput = { offeringId: selected.id, quantity, unit, expectedPriceMinor: selected.price_minor };
      let atoms = quantityAtoms(quantity, unit);
      if (profile?.model === "measured" && selected.kind === "product") {
        const tare = quantityAtoms(customTare || "0", unit); atoms -= tare;
        if (atoms <= 0) throw new Error("La cantidad neta debe ser mayor que cero.");
        // Encode exact canonical atoms in the smallest base unit to avoid rounded decimal quantities.
        const baseUnit: Unit = unit === "kg" ? "g" : unit === "lt" ? "ml" : unit;
        input.unit = baseUnit; input.quantity = decimalInput(atoms, UNITS[baseUnit].atoms);
      }
      if (atoms <= 0) throw new Error("La cantidad debe ser mayor a cero.");
      let lineTotal = lineAmount(atoms, selected.price_minor, UNITS[selected.unit].atoms); let guarantee = 0;
      if (selected.kind === "asset" || selected.kind === "service") {
        input.quantity = "1"; input.unit = "und"; input.startsAt = parseLocalDate(start);
        if (selected.kind === "asset") {
          input.endsAt = parseLocalDate(end); input.expectedPeriod = selected.rate_period; input.expectedDepositMinor = selected.deposit_minor;
          lineTotal = rentalPeriods(input.startsAt, input.endsAt, selected.rate_period) * selected.price_minor; guarantee = selected.deposit_minor;
        } else {
          if (!staffId) throw new Error("Selecciona el profesional de la cita.");
          input.staffId = staffId; input.expectedDurationMinutes = selected.duration_minutes;
          input.endsAt = input.startsAt + selected.duration_minutes * 60_000;
        }
      }
      setCart((current) => [...current, { key: Crypto.randomUUID(), offering: selected, input, total: lineTotal, deposit: guarantee }]);
      setSelected(null); setError(""); operation.current = Crypto.randomUUID();
    } catch (cause) { setError(errorMessage(cause)); }
  }
  async function confirm() {
    if (saving) return;
    setSaving(true); setError("");
    try {
      const id = await createBusinessSale({ operationKey: operation.current, customerName: customer, paymentMethod: payment,
        receivedMinor: moneyMinor(received || "0"), lines: cart.map((row) => row.input) });
      markSaved([[], customer, ""]);
      setCart([]); setReceived(""); operation.current = Crypto.randomUUID();
      router.push({ pathname: "/view/dashboard/sale-detail", params: { id: String(id) } });
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }
  const measured = profile?.model === "measured";
  return <Page>{dialog}<Heading>{profile?.model === "rental" ? "Nueva reserva" : profile?.model === "services" ? "Nueva venta o cita" : "Nueva venta"}</Heading>
    <Field label="Cliente" placeholder={profile?.model === "rental" || profile?.model === "services" ? "Nombre obligatorio" : "Nombre opcional"} value={customer} onChangeText={setCustomer} editable={!saving} />
    <Field label="Buscar en el catálogo" value={search} onChangeText={setSearch} placeholder="Nombre, SKU o código de barras" editable={!saving} />
    {loading && <Copy>Cargando artículos…</Copy>}
    {!loading && !data.offerings.length && <Card><Copy>Tu catálogo está vacío. Registra un artículo antes de realizar la primera venta.</Copy><Button title="Crear artículo" onPress={() => router.push("/view/business/offering")} /></Card>}
    {data.offerings.map((offering) => <Button key={offering.id} secondary disabled={saving || (offering.kind === "asset" && offering.condition !== "usable")} title={`${offering.name}${offering.variant_label ? ` · ${offering.variant_label}` : ""} · ${formatMoney(offering.price_minor)}${measured ? `/${offering.unit}` : ""}`} onPress={() => select(offering)} />)}
    {selected && <Card><Heading>{selected.name}</Heading>
      {(selected.kind === "product" || selected.kind === "packaging") && <>
        {measured && selected.kind === "product" && <Choices label="Unidad de medida" value={unit} options={(Object.keys(UNITS) as Unit[]).filter((value) => UNITS[value].dimension === UNITS[selected.unit].dimension).map((value) => ({ value, label: value }))} onChange={(value) => { setUnit(value); setQuantity("1"); setTare("0"); }} />}
        <Field label={measured && selected.kind === "product" ? `Cantidad bruta en ${unit}` : "Cantidad de piezas"} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" editable={!saving} />
        {measured && selected.kind === "product" && <><Field label={`Tara en ${unit} (0 si no aplica)`} value={customTare} onChangeText={setTare} keyboardType="decimal-pad" editable={!saving} /><Copy>Para un envase nuevo agrega también el empaque al carrito. Para un envase del cliente, vende únicamente el contenido neto.</Copy></>}
      </>}
      {(selected.kind === "asset" || selected.kind === "service") && <>
        <Field label="Inicio (AAAA-MM-DD HH:mm)" value={start} onChangeText={setStart} editable={!saving} />
        <Copy>Horario local del dispositivo: {Intl.DateTimeFormat().resolvedOptions().timeZone}</Copy>
        {selected.kind === "asset" ? <><Field label="Devolución prevista (AAAA-MM-DD HH:mm)" value={end} onChangeText={setEnd} editable={!saving} /><Copy>Tarifa por {({ hour: "hora", day: "día", month: "mes" }[selected.rate_period])} iniciada. Garantía: {formatMoney(selected.deposit_minor)}</Copy></> : <>
          <Copy>Duración: {selected.duration_minutes} minutos</Copy>
          <Choices label="Profesional" value={staffId} options={data.staff.map((row) => ({ value: row.id, label: row.name }))} onChange={setStaffId} />
          {!data.staff.length && <Button title="Registrar profesional" secondary onPress={() => router.push("/(tabs)/operations")} />}
        </>}
      </>}
      {selected.kind === "digital" && <Copy>Se registrará la entrega pendiente en Agenda y accesos.</Copy>}
      {selected.kind === "subscription" && <Copy>Renovación cada {selected.subscription_months} mes(es). Registra el cobro de cada ciclo desde Agenda y accesos.</Copy>}
      <Button title="Agregar al carrito" disabled={saving} onPress={add} />
    </Card>}
    <Heading>Carrito</Heading>
    {!cart.length && <Copy>Agrega artículos para comenzar.</Copy>}
    {cart.map((line) => <Card key={line.key}><Heading>{line.offering.name}</Heading><Copy>{line.input.quantity} {line.input.unit} · {formatMoney(line.total)}</Copy>
      {line.input.startsAt && <Copy>{new Date(line.input.startsAt).toLocaleString("es-CO")} → {new Date(line.input.endsAt!).toLocaleString("es-CO")}</Copy>}
      {!!line.deposit && <Copy>Garantía: {formatMoney(line.deposit)}</Copy>}
      <Button title="Quitar" secondary disabled={saving} onPress={() => { setCart((current) => current.filter((row) => row.key !== line.key)); operation.current = Crypto.randomUUID(); }} />
    </Card>)}
    <Card><Copy>Venta: {formatMoney(total)}</Copy>{deposit > 0 && <Copy>Garantías: {formatMoney(deposit)} (separadas de los ingresos)</Copy>}<Heading>Total a cobrar: {formatMoney(total + deposit)}</Heading></Card>
    <Choices label="Método de pago" value={payment} options={[{ value: "Efectivo", label: "Efectivo" }, { value: "Transferencia", label: "Transferencia" }]} onChange={setPayment} />
    {payment === "Transferencia" && data.qr && <Image source={{ uri: data.qr }} style={{ width: "100%", height: 250 }} contentFit="contain" accessibilityLabel="QR para realizar la transferencia" />}
    <Field label={payment === "Efectivo" ? "Monto recibido en COP" : "Transferencia recibida en COP"} value={received} onChangeText={setReceived} keyboardType="decimal-pad" editable={!saving} />
    <Copy>{payment === "Transferencia" ? "Registra la venta después de verificar que recibiste la transferencia." : `Cambio: ${formatMoney(Math.max(0, tender - total - deposit))}`}</Copy>
    <ErrorText message={error} />
    <Button title={saving ? "Procesando…" : "Confirmar y registrar cobro"} disabled={saving || !cart.length} onPress={confirm} />
  </Page>;
}
