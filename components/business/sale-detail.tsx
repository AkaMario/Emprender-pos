import React, { useCallback, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { cancelBusinessOrder, getBusinessOrderDetail } from "@/database/business-database";
import { getUserByCredentials } from "@/database/auth-database";
import { useAuth } from "@/context/auth";
import { formatMoney, formatQuantity } from "@/domain/business";
import { Button, Card, Copy, ErrorText, Field, Heading, Page, errorMessage } from "./ui";
import { useBusinessQuery } from "./use-query";

export function BusinessSaleDetail() {
  const { username } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter();
  const load = useCallback(() => getBusinessOrderDetail(Number(id)), [id]);
  const { data, loading, error, setError, reload } = useBusinessQuery(load, { order: null, lines: [] });
  const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  async function cancel() {
    if (busy) return;
    setBusy(true);
    try {
      if (!username || !password || !await getUserByCredentials(username, password)) throw new Error("La contraseña de autorización no es válida.");
      await cancelBusinessOrder(Number(id), reason); setPassword(""); await reload();
    }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <Page><Button title="Regresar" secondary onPress={() => router.canGoBack() ? router.back() : router.replace("/")} /><Heading>Venta #{id}</Heading><ErrorText message={error} />{loading && <Copy>Cargando…</Copy>}
    {data.order ? <><Card><Copy>{data.order.customer_name || "Cliente de mostrador"}</Copy><Copy>{new Date(data.order.created_at).toLocaleString("es-CO")} · {data.order.payment_method}</Copy><Copy>Estado: {data.order.status === "cancelled" ? "Cancelada" : "Registrada"}</Copy></Card>
      {data.lines.map((line) => <Card key={line.id}><Heading>{line.name_snapshot}</Heading><Copy>{formatQuantity(line.quantity_atoms, line.unit_snapshot)} {line.unit_snapshot} · {formatMoney(line.total_minor)}</Copy></Card>)}
      <Card><Heading>Venta: {formatMoney(data.order.total_minor)}</Heading><Copy>Garantía: {formatMoney(data.order.deposit_minor)}</Copy><Copy>Recibido: {formatMoney(data.order.amount_received_minor)}</Copy><Copy>Cambio: {formatMoney(data.order.amount_received_minor - data.order.total_minor - data.order.deposit_minor)}</Copy></Card>
      {data.order.status !== "cancelled" && <Card><Heading>Cancelar operación</Heading><Copy>Para productos, verifica que las piezas o medidas vuelven al inventario. Devuelve al cliente el importe y la garantía antes de registrar la cancelación. Los servicios realizados y activos entregados se gestionan desde su agenda.</Copy><Field label="Motivo" value={reason} onChangeText={setReason} multiline /><Field label="Contraseña de autorización" value={password} onChangeText={setPassword} secureTextEntry /><Button title="Registrar cancelación y devolución" secondary disabled={busy || !reason.trim() || !password} onPress={cancel} /></Card>}
    </> : !loading && <Copy>No encontramos esta operación.</Copy>}
  </Page>;
}
