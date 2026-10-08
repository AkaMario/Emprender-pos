import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useBusiness } from "@/context/business";
import { getOfferings, saveOffering, setOfferingActive } from "@/database/business-database";
import { KIND_LABELS, MODEL_KINDS, UNITS, decimalInput, localDateInput, moneyMinor, parseLocalDate, quantityAtoms, type OfferingKind, type Unit } from "@/domain/business";
import { Button, Card, Choices, Copy, ErrorText, Field, Heading, Page, errorMessage } from "@/components/business/ui";

export default function OfferingForm() {
  const { profile } = useBusiness(); const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>(); const offeringId = Number(id);
  const model = profile!.model;
  const kinds = model === "restaurant" ? [] : MODEL_KINDS[model];
  const [kind, setKind] = useState<OfferingKind>(kinds[0] ?? "product");
  const [name, setName] = useState(""); const [category, setCategory] = useState("");
  const [sku, setSku] = useState(""); const [barcode, setBarcode] = useState(""); const [variant, setVariant] = useState("");
  const [unit, setUnit] = useState<Unit>(model === "measured" ? "ml" : "und");
  const [price, setPrice] = useState(""); const [stock, setStock] = useState("0"); const [low, setLow] = useState("0");
  const [lot, setLot] = useState(""); const [expiry, setExpiry] = useState("");
  const [period, setPeriod] = useState<"hour" | "day" | "month">("day"); const [deposit, setDeposit] = useState("0");
  const [duration, setDuration] = useState("60"); const [months, setMonths] = useState("1"); const [url, setUrl] = useState("");
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(Boolean(id)); const [active, setActive] = useState(true);
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getOfferings("", true).then((rows) => {
      if (!mounted) return;
      const row = rows.find((item) => item.id === offeringId);
      if (!row) throw new Error("No encontramos el artículo.");
      setName(row.name); setCategory(row.category); setKind(row.kind); setSku(row.sku ?? ""); setBarcode(row.barcode ?? ""); setVariant(row.variant_label);
      setUnit(row.unit); setPrice(decimalInput(row.price_minor, 100)); setStock(decimalInput(row.stock_atoms, UNITS[row.unit].atoms)); setLow(decimalInput(row.low_stock_atoms, UNITS[row.unit].atoms));
      setLot(row.lot_code ?? ""); setExpiry(row.expires_at ? localDateInput(row.expires_at).slice(0, 10) : "");
      setPeriod(row.rate_period); setDeposit(String(row.deposit_minor / 100)); setDuration(String(row.duration_minutes)); setMonths(String(row.subscription_months)); setUrl(row.digital_url ?? ""); setActive(Boolean(row.active));
    }).catch((cause) => { if (mounted) setError(errorMessage(cause)); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id, offeringId]);
  async function save() {
    setSaving(true); setError("");
    try {
      await saveOffering({ id: id ? offeringId : undefined, name, category, kind, sku, barcode, variant_label: variant,
        unit, price_minor: moneyMinor(price), stock_atoms: quantityAtoms(stock, unit), low_stock_atoms: quantityAtoms(low, unit),
        lot_code: lot, expires_at: expiry.trim() ? parseLocalDate(`${expiry.trim()} 23:59`) : null,
        rate_period: period, deposit_minor: moneyMinor(deposit), duration_minutes: Number(duration), subscription_months: Number(months), digital_url: url || null });
      router.back();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }
  async function toggleActive() {
    setSaving(true);
    try { await setOfferingActive(offeringId, !active); setActive(!active); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }
  const physical = kind === "product" || kind === "packaging";
  return <Page><Button title="Regresar" secondary onPress={() => router.back()} /><Heading>{id ? "Editar artículo" : "Nuevo artículo"}</Heading>
    <ErrorText message={error} />
    {loading ? <Copy>Cargando…</Copy> : <>
      {!id && kinds.length > 1 && <Choices label="Tipo de artículo" value={kind} options={kinds.map((value) => ({ value, label: KIND_LABELS[value] }))} onChange={(value) => { setKind(value); setUnit(model === "measured" && value === "product" ? "ml" : "und"); }} />}
      <Field label="Nombre" value={name} onChangeText={setName} />
      <Field label="Categoría" value={category} onChangeText={setCategory} placeholder="Ej.: Aromas, Vestidos, Consultoría" />
      <Field label={kind === "asset" ? "Identificador del activo" : "SKU"} value={sku} onChangeText={setSku} autoCapitalize="characters" />
      {model === "retail" && <><Field label="Variante (talla, color o presentación)" value={variant} onChangeText={setVariant} /><Field label="Código de barras" value={barcode} onChangeText={setBarcode} /></>}
      {model === "measured" && kind === "product" && !id && <Choices label="Unidad de precio y visualización" value={unit} options={(["ml", "lt", "g", "kg", "m"] as const).map((value) => ({ value, label: value }))} onChange={setUnit} />}
      {kind === "asset" && <Choices label="Tarifa por" value={period} options={[{ value: "hour", label: "Hora" }, { value: "day", label: "Día" }, { value: "month", label: "Mes" }]} onChange={setPeriod} />}
      <Field label={`Precio en COP${physical ? ` por ${unit}` : ""}`} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0" />
      {physical && <Card><Field label={`${id ? "Existencia actual (registra ajuste)" : "Stock inicial"} en ${unit}`} value={stock} onChangeText={setStock} keyboardType="decimal-pad" /><Field label={`Alerta de stock mínimo en ${unit}`} value={low} onChangeText={setLow} keyboardType="decimal-pad" /><Field label="Lote (opcional)" value={lot} onChangeText={setLot} /><Field label="Vencimiento (AAAA-MM-DD, opcional)" value={expiry} onChangeText={setExpiry} placeholder="2027-12-31" /></Card>}
      {kind === "asset" && <><Copy>Cada registro representa un activo individual. Las reservas no descuentan su propiedad del inventario.</Copy><Field label="Garantía en COP" value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" /></>}
      {kind === "service" && <Field label="Duración de la cita en minutos" value={duration} onChangeText={setDuration} keyboardType="number-pad" />}
      {kind === "subscription" && <Field label="Periodo de renovación en meses" value={months} onChangeText={setMonths} keyboardType="number-pad" />}
      {kind === "digital" && <Field label="Enlace de entrega (opcional)" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="https://..." />}
      <Button title={saving ? "Guardando…" : "Guardar"} disabled={saving} onPress={save} />
      {id && <Button title={active ? "Desactivar artículo" : "Activar artículo"} secondary disabled={saving} onPress={toggleActive} />}
    </>}
  </Page>;
}
