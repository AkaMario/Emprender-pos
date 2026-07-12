import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatCurrency,
  formatSaleTime,
  getInventoryItemById,
  getInventoryMovements,
  type InventoryItem,
  type InventoryMovement,
} from "@/database/pos-database";

const movementTypes = ["Todos", "entry", "stock_out", "sale", "cancel"];

export default function InventoryHistory() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inventoryItemId = Number(id);
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [type, setType] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    if (!inventoryItemId) {
      return;
    }

    const [nextItem, nextMovements] = await Promise.all([
      getInventoryItemById(inventoryItemId),
      getInventoryMovements({ inventoryItemId, type, startDate, endDate }),
    ]);

    setItem(nextItem);
    setMovements(nextMovements);
  }, [endDate, inventoryItemId, startDate, type]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function movementLabel(value: string) {
    if (value === "entry") return "Entrada";
    if (value === "stock_out") return "Salida";
    if (value === "sale") return "Venta";
    if (value === "cancel") return "Cancelacion";
    return value;
  }

  function movementColor(value: string) {
    if (value === "entry" || value === "cancel") return "#16a34a";
    if (value === "stock_out") return "#dc2626";
    return "#f97316";
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black">
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="rounded-full p-2 active:bg-slate-200">
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text className="text-xl font-black text-slate-950 dark:text-white">Historial</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <View className="rounded-3xl bg-white p-5 dark:bg-slate-900">
          <Text className="text-sm font-black uppercase tracking-wide text-slate-500">Balance actual</Text>
          <Text className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{item?.name ?? "Insumo"}</Text>
          <Text className="mt-2 text-xl font-black text-orange-600">
            {item ? `${item.currentQuantity} ${item.unit}` : "-"}
          </Text>
          {item ? <Text className="mt-1 text-sm font-semibold text-slate-500">Minimo: {item.lowStockThreshold} {item.unit} · {item.status}</Text> : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {movementTypes.map((value) => (
              <Pressable key={value} onPress={() => setType(value)} className={`rounded-full px-4 py-3 ${type === value ? "bg-slate-950" : "bg-white dark:bg-slate-900"}`}>
                <Text className={`text-sm font-black ${type === value ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{movementLabel(value)}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View className="flex-row gap-3">
          <TextInput value={startDate} onChangeText={setStartDate} placeholder="Desde YYYY-MM-DD" placeholderTextColor="#94a3b8" className="flex-1 rounded-2xl bg-white px-4 py-4 font-semibold text-slate-950 dark:bg-slate-900 dark:text-white" />
          <TextInput value={endDate} onChangeText={setEndDate} placeholder="Hasta YYYY-MM-DD" placeholderTextColor="#94a3b8" className="flex-1 rounded-2xl bg-white px-4 py-4 font-semibold text-slate-950 dark:bg-slate-900 dark:text-white" />
        </View>

        <View className="gap-3">
          {movements.length === 0 ? (
            <Text className="rounded-2xl bg-white p-5 text-center font-semibold text-slate-500 dark:bg-slate-900">
              No hay movimientos para este filtro.
            </Text>
          ) : null}
          {movements.map((movement) => {
            const color = movementColor(movement.type);

            return (
              <View key={movement.id} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-black text-slate-950 dark:text-white">{movementLabel(movement.type)}</Text>
                    <Text className="mt-1 text-sm font-semibold text-slate-500">
                      {new Date(movement.createdAt).toISOString().slice(0, 10)} · {formatSaleTime(movement.createdAt)}
                    </Text>
                    {movement.reason ? <Text className="mt-1 text-sm font-semibold text-slate-500">Motivo: {movement.reason}</Text> : null}
                    {movement.supplier ? <Text className="mt-1 text-sm font-semibold text-slate-500">Proveedor: {movement.supplier}</Text> : null}
                    {movement.invoiceNumber ? <Text className="mt-1 text-sm font-semibold text-slate-500">Comprobante: {movement.invoiceNumber}</Text> : null}
                    {movement.unitCost ? <Text className="mt-1 text-sm font-semibold text-slate-500">Costo unitario: {formatCurrency(movement.unitCost)}</Text> : null}
                    {movement.notes ? <Text className="mt-1 text-sm font-semibold text-slate-500">Obs: {movement.notes}</Text> : null}
                  </View>
                  <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${color}20` }}>
                    <Text className="font-black" style={{ color }}>{movement.quantity}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
