import { useFormProtection } from "@/hooks/use-form-protection";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useBusiness } from "@/context/business";
import {
  getOfferings,
  saveOffering,
  setOfferingActive,
} from "@/database/business-database";
import {
  KIND_LABELS,
  MODEL_KINDS,
  UNITS,
  decimalInput,
  localDateInput,
  moneyMinor,
  parseLocalDate,
  quantityAtoms,
  type OfferingKind,
  type Unit,
} from "@/domain/business";
import {
  Button,
  Card,
  Choices,
  Copy,
  ErrorText,
  Field,
  Heading,
  Page,
  errorMessage,
} from "@/components/business/ui";

export default function OfferingForm() {
  const { profile } = useBusiness();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const offeringId = Number(id);
  const model = profile!.model;
  const kinds = model === "restaurant" ? [] : MODEL_KINDS[model];
  const [kind, setKind] = useState<OfferingKind>(kinds[0] ?? "product");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [variant, setVariant] = useState("");
  const [unit, setUnit] = useState<Unit>(model === "measured" ? "ml" : "und");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [low, setLow] = useState("0");
  const [lot, setLot] = useState("");
  const [expiry, setExpiry] = useState("");
  const [period, setPeriod] = useState<"hour" | "day" | "month">("day");
  const [deposit, setDeposit] = useState("0");
  const [duration, setDuration] = useState("60");
  const [months, setMonths] = useState("1");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [active, setActive] = useState(true);
  const { dialog, markSaved } = useFormProtection(
    [
      kind,
      name,
      category,
      sku,
      barcode,
      variant,
      unit,
      price,
      stock,
      low,
      lot,
      expiry,
      period,
      deposit,
      duration,
      months,
      url,
    ],
    saving,
    !loading,
  );
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getOfferings("", true)
      .then((rows) => {
        if (!mounted) return;
        const row = rows.find((item) => item.id === offeringId);
        if (!row) throw new Error("No encontramos el artículo.");
        setName(row.name);
        setCategory(row.category);
        setKind(row.kind);
        setSku(row.sku ?? "");
        setBarcode(row.barcode ?? "");
        setVariant(row.variant_label);
        setUnit(row.unit);
        setPrice(decimalInput(row.price_minor, 100));
        setStock(decimalInput(row.stock_atoms, UNITS[row.unit].atoms));
        setLow(decimalInput(row.low_stock_atoms, UNITS[row.unit].atoms));
        setLot(row.lot_code ?? "");
        setExpiry(
          row.expires_at ? localDateInput(row.expires_at).slice(0, 10) : "",
        );
        setPeriod(row.rate_period);
        setDeposit(String(row.deposit_minor / 100));
        setDuration(String(row.duration_minutes));
        setMonths(String(row.subscription_months));
        setUrl(row.digital_url ?? "");
        setActive(Boolean(row.active));
      })
      .catch((cause) => {
        if (mounted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, offeringId]);
  const [attempted, setAttempted] = useState(false);
  function validate() {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Escribe el nombre del artículo.";
    if (!category.trim()) errors.category = "Escribe una categoría.";
    if (model === "retail" && !sku.trim())
      errors.sku = "Ingresa el SKU para identificar el producto.";
    for (const [key, value, parser] of [
      ["price", price, () => moneyMinor(price)],
      ["stock", stock, () => quantityAtoms(stock, unit)],
      ["low", low, () => quantityAtoms(low, unit)],
      ["deposit", deposit, () => moneyMinor(deposit)],
    ] as const) {
      try {
        if (!value.trim())
          throw new Error("Ingresa un valor; utiliza 0 si corresponde.");
        parser();
      } catch (cause) {
        errors[key] = errorMessage(cause);
      }
    }
    if (expiry.trim())
      try {
        parseLocalDate(`${expiry.trim()} 23:59`);
      } catch {
        errors.expiry = "Usa una fecha válida con formato AAAA-MM-DD.";
      }
    if (!Number.isSafeInteger(Number(duration)) || Number(duration) < 1)
      errors.duration = "Ingresa un número entero de minutos mayor que cero.";
    if (!Number.isSafeInteger(Number(months)) || Number(months) < 1)
      errors.months = "Ingresa un número entero de meses mayor que cero.";
    if (url.trim() && !/^https?:\/\//i.test(url.trim()))
      errors.url = "El enlace debe comenzar con https:// o http://.";
    return errors;
  }
  const fieldErrors = attempted ? validate() : {};
  async function save() {
    if (saving || loading) return;
    setAttempted(true);
    if (Object.keys(validate()).length) {
      setError("Revisa los campos indicados antes de guardar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveOffering({
        id: id ? offeringId : undefined,
        name,
        category,
        kind,
        sku,
        barcode,
        variant_label: variant,
        unit,
        price_minor: moneyMinor(price),
        stock_atoms: quantityAtoms(stock, unit),
        low_stock_atoms: quantityAtoms(low, unit),
        lot_code: lot,
        expires_at: expiry.trim()
          ? parseLocalDate(`${expiry.trim()} 23:59`)
          : null,
        rate_period: period,
        deposit_minor: moneyMinor(deposit),
        duration_minutes: Number(duration),
        subscription_months: Number(months),
        digital_url: url || null,
      });
      markSaved();
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  async function toggleActive() {
    if (saving) return;
    setSaving(true);
    try {
      await setOfferingActive(offeringId, !active);
      setActive(!active);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  const physical = kind === "product" || kind === "packaging";
  return (
    <Page>
      {dialog}
      <Heading>{id ? "Editar artículo" : "Nuevo artículo"}</Heading>
      <ErrorText message={error} />
      {loading ? (
        <Copy>Cargando…</Copy>
      ) : (
        <>
          {!id && kinds.length > 1 && (
            <Choices
              label="Tipo de artículo"
              value={kind}
              options={kinds.map((value) => ({
                value,
                label: KIND_LABELS[value],
              }))}
              onChange={(value) => {
                setKind(value);
                setUnit(
                  model === "measured" && value === "product" ? "ml" : "und",
                );
              }}
            />
          )}
          <Field
            required
            label="Nombre"
            error={fieldErrors.name}
            editable={!saving}
            value={name}
            onChangeText={setName}
          />
          <Field
            required
            label="Categoría"
            error={fieldErrors.category}
            editable={!saving}
            value={category}
            onChangeText={setCategory}
            placeholder="Ej.: Aromas, Vestidos, Consultoría"
          />
          <Field
            label={kind === "asset" ? "Identificador del activo" : "SKU"}
            error={fieldErrors.sku}
            editable={!saving}
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
          />
          {model === "retail" && (
            <>
              <Field
                label="Variante (talla, color o presentación)"
                value={variant}
                onChangeText={setVariant}
              />
              <Field
                label="Código de barras"
                value={barcode}
                onChangeText={setBarcode}
              />
            </>
          )}
          {model === "measured" && kind === "product" && !id && (
            <Choices
              label="Unidad de precio y visualización"
              value={unit}
              options={(["ml", "lt", "g", "kg", "m"] as const).map((value) => ({
                value,
                label: value,
              }))}
              onChange={setUnit}
            />
          )}
          {kind === "asset" && (
            <Choices
              label="Tarifa por"
              value={period}
              options={[
                { value: "hour", label: "Hora" },
                { value: "day", label: "Día" },
                { value: "month", label: "Mes" },
              ]}
              onChange={setPeriod}
            />
          )}
          <Field
            label={`Precio en COP${physical ? ` por ${unit}` : ""}`}
            error={fieldErrors.price}
            editable={!saving}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0"
          />
          {physical && (
            <Card>
              <Field
                label={`${id ? "Existencia actual (registra ajuste)" : "Stock inicial"} en ${unit}`}
                error={fieldErrors.stock}
                editable={!saving}
                value={stock}
                onChangeText={setStock}
                keyboardType="decimal-pad"
              />
              <Field
                label={`Alerta de stock mínimo en ${unit}`}
                error={fieldErrors.low}
                editable={!saving}
                value={low}
                onChangeText={setLow}
                keyboardType="decimal-pad"
              />
              <Field
                label="Lote (opcional)"
                value={lot}
                onChangeText={setLot}
              />
              <Field
                label="Vencimiento (AAAA-MM-DD, opcional)"
                error={fieldErrors.expiry}
                editable={!saving}
                value={expiry}
                onChangeText={setExpiry}
                placeholder="2027-12-31"
              />
            </Card>
          )}
          {kind === "asset" && (
            <>
              <Copy>
                Cada registro representa un activo individual. Las reservas no
                descuentan su propiedad del inventario.
              </Copy>
              <Field
                label="Garantía en COP"
                error={fieldErrors.deposit}
                editable={!saving}
                value={deposit}
                onChangeText={setDeposit}
                keyboardType="decimal-pad"
              />
            </>
          )}
          {kind === "service" && (
            <Field
              label="Duración de la cita en minutos"
              error={fieldErrors.duration}
              editable={!saving}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
            />
          )}
          {kind === "subscription" && (
            <Field
              label="Periodo de renovación en meses"
              error={fieldErrors.months}
              editable={!saving}
              value={months}
              onChangeText={setMonths}
              keyboardType="number-pad"
            />
          )}
          {kind === "digital" && (
            <Field
              label="Enlace de entrega (opcional)"
              error={fieldErrors.url}
              editable={!saving}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://..."
            />
          )}
          <Button
            title={saving ? "Guardando…" : "Guardar"}
            disabled={saving}
            loading={saving}
            onPress={save}
          />
          {id && (
            <Button
              title={active ? "Desactivar artículo" : "Activar artículo"}
              secondary
              disabled={saving}
              onPress={toggleActive}
            />
          )}
        </>
      )}
    </Page>
  );
}
