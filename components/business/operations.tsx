import React, { useCallback, useState } from "react";
import { Linking, Share } from "react-native";
import { useBusiness } from "@/context/business";
import { addStaff, cancelSubscription, getOperations, getStaff, renewSubscription, updateAccess, updateBooking, type Booking } from "@/database/business-database";
import { formatMoney, formatQuantity, localDateInput, moneyMinor, parseLocalDate } from "@/domain/business";
import { Button, Card, Choices, Copy, ErrorText, Field, Heading, Page, errorMessage } from "./ui";
import { useBusinessQuery } from "./use-query";

const STATES: Record<string, string> = { reserved: "Reservado", delivered: "Entregado", returned: "Devuelto", completed: "Finalizado", cancelled: "Cancelado", pending: "Pendiente de entrega", revoked: "Acceso revocado", active: "Activo" };
export function BusinessOperations() {
  const { profile, definition } = useBusiness();
  const load = useCallback(async () => ({ ...await getOperations(), staff: await getStaff() }), []);
  const { data, loading, error, setError, reload } = useBusinessQuery(load, { bookings: [], accesses: [], subscriptions: [], movements: [], staff: [] });
  const [staffName, setStaffName] = useState(""); const [busy, setBusy] = useState(false);
  const [day, setDay] = useState(""); const [payment, setPayment] = useState<"Efectivo" | "Transferencia">("Efectivo");
  async function run(work: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await work(); await reload(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  let bookings = data.bookings; let dateError = "";
  if (day.trim()) {
    try { const start = parseLocalDate(`${day.trim()} 00:00`); const end = new Date(start); end.setDate(end.getDate() + 1); bookings = bookings.filter((row) => row.starts_at < end.getTime() && row.ends_at > start); }
    catch (cause) { dateError = errorMessage(cause); bookings = []; }
  }
  const temporal = profile?.model === "rental" || profile?.model === "services";
  return <Page><Heading>{definition?.operations}</Heading><ErrorText message={error} />{loading && <Copy>Cargando operaciones…</Copy>}
    {profile?.model === "services" && <Card><Heading>Profesionales</Heading><Copy>{data.staff.map((person) => person.name).join(" · ") || "Registra personal para asignar citas."}</Copy><Field label="Nombre del profesional" value={staffName} onChangeText={setStaffName} /><Button title="Agregar profesional" disabled={busy || !staffName.trim()} onPress={() => { void run(async () => { await addStaff(staffName); setStaffName(""); }); }} /></Card>}
    {temporal && <><Heading>{profile?.model === "rental" ? "Calendario de reservas" : "Agenda de citas"}</Heading><Field label="Día (AAAA-MM-DD, vacío para ver todo)" placeholder={localDateInput().slice(0, 10)} value={day} onChangeText={setDay} /><ErrorText message={dateError} />
      {!bookings.length && !loading && <Copy>No hay reservas o citas para este filtro.</Copy>}
      {bookings.map((booking) => <BookingCard key={booking.id} booking={booking} busy={busy} onChange={(state, refund, notes) => { void run(() => updateBooking(booking.id, state, refund, notes)); }} />)}
    </>}
    {profile?.model === "services" && <>
      <Heading>Entregas digitales</Heading>
      <Copy>Comparte el contenido y registra su entrega. Si utilizas una plataforma externa, concede o revoca allí el acceso del cliente; el registro de esta app no modifica sus permisos.</Copy>
      {!data.accesses.length && <Copy>No hay entregas registradas.</Copy>}
      {data.accesses.map((access) => <Card key={access.id}><Heading>{access.name}</Heading><Copy>{access.customer_name} · {STATES[access.state]}</Copy><Field label="Código de entrega" value={access.access_code} editable={false} selectTextOnFocus />
        {access.url_snapshot && <Button title="Abrir contenido" secondary onPress={() => { Linking.openURL(access.url_snapshot!).catch((cause) => setError(errorMessage(cause))); }} />}
        {access.state !== "revoked" && <Button title="Compartir entrega" secondary onPress={() => { Share.share({ message: `${access.name}\nCódigo de entrega: ${access.access_code}${access.url_snapshot ? `\n${access.url_snapshot}` : ""}` }).catch((cause) => setError(errorMessage(cause))); }} />}
        {access.state === "pending" && <Button title="Registrar entrega al cliente" disabled={busy} onPress={() => { void run(() => updateAccess(access.id, "delivered")); }} />}
        {access.state !== "revoked" && <Button title="Registrar revocación" secondary disabled={busy} onPress={() => { void run(() => updateAccess(access.id, "revoked")); }} />}
      </Card>)}
      <Heading>Suscripciones</Heading>
      <Copy>Verifica que recibiste el pago antes de registrar una renovación. Los cobros se registran manualmente.</Copy>
      <Choices label="Medio de pago de renovación" value={payment} options={[{ value: "Efectivo", label: "Efectivo" }, { value: "Transferencia", label: "Transferencia" }]} onChange={setPayment} />
      {!data.subscriptions.length && <Copy>No hay suscripciones registradas.</Copy>}
      {data.subscriptions.map((sub) => <Card key={sub.id}><Heading>{sub.name}</Heading><Copy>{sub.customer_name} · {STATES[sub.state]}</Copy><Copy>Próximo ciclo: {new Date(sub.next_due_at).toLocaleString("es-CO")} · {formatMoney(sub.price_minor)}</Copy>
        {sub.state === "active" && <><Button title={`Registrar cobro de renovación · ${formatMoney(sub.price_minor)}`} disabled={busy || sub.next_due_at > Date.now()} onPress={() => { void run(() => renewSubscription(sub.id, sub.next_due_at, payment)); }} /><Button title="Cancelar próximas renovaciones" secondary disabled={busy} onPress={() => { void run(() => cancelSubscription(sub.id)); }} /></>}
      </Card>)}
    </>}
    {!temporal && <><Heading>Historial de inventario</Heading><Copy>Últimos 100 movimientos.</Copy>{!data.movements.length && <Copy>No hay movimientos registrados.</Copy>}{data.movements.map((movement) => <Card key={movement.id}><Heading>{movement.name}</Heading><Copy>{movement.delta_atoms > 0 ? "+" : ""}{formatQuantity(movement.delta_atoms, movement.unit)} {movement.unit} · {movement.reason}</Copy><Copy>{new Date(movement.created_at).toLocaleString("es-CO")}</Copy></Card>)}</>}
  </Page>;
}
function BookingCard({ booking, busy, onChange }: { booking: Booking; busy: boolean; onChange: (state: "delivered" | "returned" | "completed", refund?: number, notes?: string) => void }) {
  const [refund, setRefund] = useState(String(booking.deposit_minor / 100)); const [notes, setNotes] = useState(""); const [error, setError] = useState("");
  return <Card><Heading>{booking.name}</Heading><Copy>{booking.customer_name}{booking.staff_name ? ` · ${booking.staff_name}` : ""} · {STATES[booking.state]}</Copy><Copy>{new Date(booking.starts_at).toLocaleString("es-CO")} → {new Date(booking.ends_at).toLocaleString("es-CO")}</Copy>
    {booking.kind === "asset" && <Copy>Garantía: {formatMoney(booking.deposit_minor)} · Devuelta: {formatMoney(booking.refunded_minor)} · Retenida: {formatMoney(booking.retained_minor)}</Copy>}
    {booking.kind === "asset" && booking.state === "reserved" && <Button title="Registrar entrega del activo" disabled={busy} onPress={() => onChange("delivered")} />}
    {booking.kind === "asset" && booking.state === "delivered" && <><Field label="Garantía devuelta al cliente (COP)" value={refund} onChangeText={setRefund} keyboardType="decimal-pad" /><Field label="Inspección y motivo de retención, si aplica" value={notes} onChangeText={setNotes} multiline /><ErrorText message={error} /><Button title="Registrar devolución e inspección" disabled={busy} onPress={() => { try { setError(""); onChange("returned", moneyMinor(refund), notes); } catch (cause) { setError(errorMessage(cause)); } }} /></>}
    {booking.kind === "service" && booking.state === "reserved" && <Button title="Registrar servicio realizado" disabled={busy} onPress={() => onChange("completed")} />}
  </Card>;
}
