import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useBusiness } from "@/context/business";
import { getOfferings, setAssetCondition } from "@/database/business-database";
import { formatMoney, formatQuantity, KIND_LABELS } from "@/domain/business";
import { Button, Card, Copy, ErrorText, Field, Heading, Page, errorMessage } from "./ui";
import { useBusinessQuery } from "./use-query";

export function BusinessCatalog({ inventory = false }: { inventory?: boolean }) {
  const { profile, definition } = useBusiness();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const load = useCallback(async () => ({ items: await getOfferings(search, true), now: Date.now() }), [search]);
  const { data, error, loading, reload, setError } = useBusinessQuery(load, { items: [], now: 0 });
  const items = inventory ? data.items.filter((item) => item.kind === "product" || item.kind === "packaging" || item.kind === "asset") : data.items;
  async function condition(id: number, maintenance: boolean) {
    try { await setAssetCondition(id, maintenance ? "maintenance" : "usable"); await reload(); }
    catch (cause) { setError(errorMessage(cause)); }
  }
  return <Page>
    <Heading>{inventory ? definition?.inventory : definition?.catalog}</Heading>
    <Button title={profile?.model === "rental" ? "Registrar activo" : profile?.model === "services" ? "Crear servicio, contenido o plan" : "Crear producto"} onPress={() => router.push("/view/business/offering")} />
    <Field label="Buscar" placeholder="Nombre, SKU, código de barras o variante" value={search} onChangeText={setSearch} />
    <ErrorText message={error} />
    {loading && <Copy>Cargando catálogo…</Copy>}
    {!loading && !items.length && <Card><Copy>Aún no hay artículos. Crea el primero para comenzar a operar.</Copy></Card>}
    {items.map((item) => <Card key={item.id}>
      <Heading>{item.name}{item.variant_label ? ` · ${item.variant_label}` : ""}</Heading>
      <Copy>{item.category} · {KIND_LABELS[item.kind]}{item.active ? "" : " · Inactivo"}</Copy>
      <Copy>{formatMoney(item.price_minor)} / {item.kind === "asset" ? ({ hour: "hora", day: "día", month: "mes" }[item.rate_period]) : item.kind === "subscription" ? `${item.subscription_months} mes(es)` : item.unit}</Copy>
      {(item.kind === "product" || item.kind === "packaging") && <Copy>Existencias: {formatQuantity(item.stock_atoms, item.unit)} {item.unit}{item.stock_atoms <= item.low_stock_atoms ? " · Stock bajo" : ""}</Copy>}
      {item.sku && <Copy>SKU: {item.sku}{item.barcode ? ` · Código: ${item.barcode}` : ""}</Copy>}
      {item.lot_code && <Copy>Lote: {item.lot_code}</Copy>}
      {item.expires_at && <Copy>Vence: {new Date(item.expires_at).toLocaleDateString("es-CO")}{item.expires_at <= data.now ? " · Vencido" : ""}</Copy>}
      {item.kind === "asset" && <Copy>{item.condition === "maintenance" ? "En mantenimiento" : "Operativo · Consulta el calendario de reservas"} · Garantía: {formatMoney(item.deposit_minor)}</Copy>}
      {item.kind === "service" && <Copy>Duración: {item.duration_minutes} minutos</Copy>}
      <View className="flex-row flex-wrap gap-2">
        <Button title={inventory && item.kind !== "asset" ? "Ajustar existencias" : "Editar"} secondary onPress={() => router.push({ pathname: "/view/business/offering", params: { id: String(item.id) } })} />
        {item.kind === "asset" && <Button title={item.condition === "maintenance" ? "Habilitar activo" : "Mantenimiento"} secondary onPress={() => { void condition(item.id, item.condition !== "maintenance"); }} />}
      </View>
    </Card>)}
  </Page>;
}
