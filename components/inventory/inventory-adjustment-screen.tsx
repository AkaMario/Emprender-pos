import { Button } from "@/components/ui/button";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { LoadFeedback, useLoadFeedback } from "@/components/ui/load-feedback";
import { ErrorText } from "@/components/business/ui";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { useFormProtection } from "@/hooks/use-form-protection";
import { AppInput, AutoField } from "@/components/ui/form-input";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  adjustInventoryItem,
  getInventoryItems,
  type InventoryItem,
} from "@/database/pos-database";

interface InventoryAdjustmentScreenProps {
  mode: "entry" | "stock_out";
}

export function InventoryAdjustmentScreen({ mode }: InventoryAdjustmentScreenProps) {
  const router = useRouter();
  const isEntry = mode === "entry";
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(isEntry ? "Compra" : "Merma");
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const { dialog, markSaved } = useFormProtection([quantity, supplier, invoiceNumber, unitCost, notes, reason], saving, true);
  const loadItems = useCallback(async () => {
    const nextItems = await getInventoryItems();
    setItems(nextItems);
    setSelectedItemId((current) => current ?? nextItems[0]?.id ?? null);
  }, []);

  const loadStatus = useLoadFeedback(loadItems);

  async function saveAdjustment() {
    if (saving) return;
    setAttempted(true);
    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      Alert.alert("Cantidad requerida", "Ingresa una cantidad mayor a cero.");
      return;
    }

    setSaving(true);
    try {
      if (!selectedItemId) {
        throw new Error("Selecciona un insumo.");
      }

      if (!isEntry && !reason.trim()) {
        throw new Error("El motivo es obligatorio.");
      }

      await adjustInventoryItem({
        inventoryItemId: selectedItemId,
        type: mode,
        quantity: numericQuantity,
        reason,
        supplier,
        invoiceNumber,
        unitCost: unitCost ? Number(unitCost) : null,
        notes,
      });

      markSaved();
      Alert.alert("Inventario actualizado", "El movimiento fue registrado.", [
        { text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace("/") },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-background ">{dialog}


      <ScreenScroll contentContainerClassName="gap-4 p-4 pb-10"><LoadFeedback {...loadStatus} />
        <Text className="text-sm font-semibold text-muted">
          {isEntry
            ? "Selecciona un insumo y registra la compra o recepcion."
            : "Selecciona el insumo y registra la salida por merma, daño o ajuste."}
        </Text>

        {items.length > 0 ? (
          <View className="gap-2">
            <Text className="text-sm font-black text-muted ">Insumo</Text>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItemId(item.id)}
                className={`rounded-2xl p-4 ${selectedItemId === item.id ? "bg-primary" : "bg-surface "}`}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text className={`font-black ${selectedItemId === item.id ? "text-onPrimary" : "text-text "}`}>
                    {item.name}
                  </Text>
                  <Text className={`font-bold ${selectedItemId === item.id ? "text-onPrimary" : "text-muted"}`}>
                    {item.currentQuantity} {item.unit}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {items.length === 0 ? (
          <Text className="rounded-2xl bg-surface p-4 text-center font-semibold text-muted ">
            Primero registra insumos en el modulo Inventario.
          </Text>
        ) : null}

        <Input
          value={quantity}
          onChangeText={(value) => setQuantity(value.replace(/[^0-9.]/g, ""))}
          placeholder={isEntry ? "Cantidad recibida" : "Cantidad a descontar"}
          keyboardType="decimal-pad"
        />
        {attempted && (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) && <ErrorText message="Ingresa una cantidad mayor que cero." />}
        {isEntry ? (
          <>
            <Input value={supplier} onChangeText={setSupplier} placeholder="Proveedor (opcional)" />
            <Input value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="Factura/comprobante (opcional)" />
            <Input value={unitCost} onChangeText={(value) => setUnitCost(value.replace(/[^0-9]/g, ""))} placeholder="Costo unitario (opcional)" keyboardType="number-pad" />
            <Input value={notes} onChangeText={setNotes} placeholder="Observaciones (opcional)" />
          </>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-2">
              {["Merma", "Daño", "Ajuste", "Caducado", "Otro"].map((item) => (
                <Pressable key={item} onPress={() => setReason(item)} className={`rounded-full px-4 py-3 ${reason === item ? "bg-primary" : "bg-surface "}`}>
                  <Text className={`text-sm font-black ${reason === item ? "text-onPrimary" : "text-text "}`}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Input value={notes} onChangeText={setNotes} placeholder="Observaciones adicionales (opcional)" />
          </>
        )}

        <Button title="Registrar movimiento" loading={saving} onPress={saveAdjustment} />
      </ScreenScroll>
    </SafeAreaView>
  );
}

function Input(props: React.ComponentProps<typeof AppInput>) {
  return (
    <AutoField
      className="rounded-2xl bg-surface px-4 py-4 text-base font-semibold text-text "
      {...props}
    />
  );
}
