import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  adjustInventoryItem,
  createInventoryItem,
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
  const [reason, setReason] = useState(isEntry ? "Compra de insumos" : "Merma");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newLowStock, setNewLowStock] = useState("");
  const [newCriticalStock, setNewCriticalStock] = useState("");
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
      let inventoryItemId = selectedItemId;

      if (isEntry && !inventoryItemId) {
        if (!newName.trim() || !newUnit.trim()) {
          throw new Error("Crea un insumo con nombre y unidad antes de registrar la entrada.");
        }

        inventoryItemId = await createInventoryItem({
          name: newName,
          unit: newUnit,
          currentQuantity: 0,
          lowStockThreshold: Number(newLowStock || 0),
          criticalStockThreshold: Number(newCriticalStock || 0),
        });
      }

      if (!inventoryItemId) {
        throw new Error("Selecciona un insumo.");
      }

      await adjustInventoryItem({
        inventoryItemId,
        type: mode,
        quantity: numericQuantity,
        reason,
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
            ? "Selecciona un insumo existente o crea uno nuevo para registrar entrada."
            : "Selecciona el insumo y registra la salida por merma u otro motivo."}
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

        {isEntry && !selectedItemId ? (
          <View className="gap-3 rounded-3xl bg-white p-4 dark:bg-slate-900">
            <Text className="text-base font-black text-slate-950 dark:text-white">Nuevo insumo</Text>
            <Input value={newName} onChangeText={setNewName} placeholder="Nombre" />
            <Input value={newUnit} onChangeText={setNewUnit} placeholder="Unidad (oz, g, und)" />
            <Input value={newLowStock} onChangeText={(value) => setNewLowStock(value.replace(/[^0-9.]/g, ""))} placeholder="Umbral bajo" keyboardType="decimal-pad" />
            <Input value={newCriticalStock} onChangeText={(value) => setNewCriticalStock(value.replace(/[^0-9.]/g, ""))} placeholder="Umbral critico" keyboardType="decimal-pad" />
          </View>
        ) : null}

        {isEntry && items.length > 0 ? (
          <Pressable onPress={() => setSelectedItemId(null)} className="rounded-2xl border border-dashed border-slate-300 p-4">
            <Text className="text-center font-black text-slate-600">Crear insumo nuevo</Text>
          </Pressable>
        ) : null}

        <Input
          value={quantity}
          onChangeText={(value) => setQuantity(value.replace(/[^0-9.]/g, ""))}
          placeholder="Cantidad"
          keyboardType="decimal-pad"
        />
        <Input value={reason} onChangeText={setReason} placeholder="Motivo" />

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
