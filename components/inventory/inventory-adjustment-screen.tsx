import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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

  const loadItems = useCallback(async () => {
    const nextItems = await getInventoryItems();
    setItems(nextItems);
    setSelectedItemId((current) => current ?? nextItems[0]?.id ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  async function saveAdjustment() {
    const numericQuantity = Number(quantity);

    if (!numericQuantity || numericQuantity <= 0) {
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

      Alert.alert("Inventario actualizado", "El movimiento fue registrado.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black">
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="rounded-full p-2 active:bg-slate-200">
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text className="text-xl font-black text-slate-950 dark:text-white">
          {isEntry ? "Entrada de Insumos" : "Salida de Stock"}
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <Text className="text-sm font-semibold text-slate-500">
          {isEntry
            ? "Selecciona un insumo y registra la compra o recepcion."
            : "Selecciona el insumo y registra la salida por merma, daño o ajuste."}
        </Text>

        {items.length > 0 ? (
          <View className="gap-2">
            <Text className="text-sm font-black text-slate-600 dark:text-slate-300">Insumo</Text>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItemId(item.id)}
                className={`rounded-2xl p-4 ${selectedItemId === item.id ? "bg-slate-950" : "bg-white dark:bg-slate-900"}`}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text className={`font-black ${selectedItemId === item.id ? "text-white" : "text-slate-950 dark:text-white"}`}>
                    {item.name}
                  </Text>
                  <Text className={`font-bold ${selectedItemId === item.id ? "text-white" : "text-slate-500"}`}>
                    {item.currentQuantity} {item.unit}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {items.length === 0 ? (
          <Text className="rounded-2xl bg-white p-4 text-center font-semibold text-slate-500 dark:bg-slate-900">
            Primero registra insumos en el modulo Inventario.
          </Text>
        ) : null}

        <Input
          value={quantity}
          onChangeText={(value) => setQuantity(value.replace(/[^0-9.]/g, ""))}
          placeholder={isEntry ? "Cantidad recibida" : "Cantidad a descontar"}
          keyboardType="decimal-pad"
        />
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
                <Pressable key={item} onPress={() => setReason(item)} className={`rounded-full px-4 py-3 ${reason === item ? "bg-slate-950" : "bg-white dark:bg-slate-900"}`}>
                  <Text className={`text-sm font-black ${reason === item ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Input value={notes} onChangeText={setNotes} placeholder="Observaciones adicionales (opcional)" />
          </>
        )}

        <Pressable
          disabled={saving}
          onPress={saveAdjustment}
          className="rounded-2xl bg-orange-600 px-5 py-4 active:opacity-85"
        >
          <Text className="text-center font-black text-white">
            {saving ? "Guardando..." : "Registrar movimiento"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#94a3b8"
      className="rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-900 dark:text-white"
      {...props}
    />
  );
}
