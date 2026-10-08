import { colorContainer, useDesignColors } from "@/constants/design";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { LoadFeedback, useLoadFeedback } from "@/components/ui/load-feedback";
import { AppInput } from "@/components/ui/form-input";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
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
  const c = useDesignColors();
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

  const loadStatus = useLoadFeedback(load);

  function movementLabel(value: string) {
    if (value === "entry") return "Entrada";
    if (value === "stock_out") return "Salida";
    if (value === "sale") return "Venta";
    if (value === "cancel") return "Cancelacion";
    return value;
  }

  function movementColor(value: string) {
    if (value === "entry" || value === "cancel") return c.success;
    if (value === "stock_out") return c.error;
    return c.primary;
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-background ">


      <ScreenScroll contentContainerClassName="gap-4 p-4 pb-10"><LoadFeedback {...loadStatus} />
        <View className="rounded-3xl bg-surface p-5 ">
          <Text className="text-sm font-black uppercase tracking-wide text-muted">Balance actual</Text>
          <Text className="mt-2 text-3xl font-black text-text ">{item?.name ?? "Insumo"}</Text>
          <Text className="mt-2 text-xl font-black text-link">
            {item ? `${item.currentQuantity} ${item.unit}` : "-"}
          </Text>
          {item ? <Text className="mt-1 text-sm font-semibold text-muted">Minimo: {item.lowStockThreshold} {item.unit} · {item.status}</Text> : null}
        </View>

        <ScreenScroll horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {movementTypes.map((value) => (
              <Pressable key={value} onPress={() => setType(value)} className={`rounded-full px-4 py-3 ${type === value ? "bg-primary" : "bg-surface "}`}>
                <Text className={`text-sm font-black ${type === value ? "text-onPrimary" : "text-text "}`}>{movementLabel(value)}</Text>
              </Pressable>
            ))}
          </View>
        </ScreenScroll>

        <View className="flex-row gap-3">
          <AppInput value={startDate} onChangeText={setStartDate} placeholder="Desde YYYY-MM-DD" className="flex-1 rounded-2xl bg-surface px-4 py-4 font-semibold text-text " />
          <AppInput value={endDate} onChangeText={setEndDate} placeholder="Hasta YYYY-MM-DD" className="flex-1 rounded-2xl bg-surface px-4 py-4 font-semibold text-text " />
        </View>

        <View className="gap-3">
          {movements.length === 0 ? (
            <Text className="rounded-2xl bg-surface p-5 text-center font-semibold text-muted ">
              No hay movimientos para este filtro.
            </Text>
          ) : null}
          {movements.map((movement) => {
            const color = movementColor(movement.type);

            return (
              <View key={movement.id} className="rounded-2xl bg-surface p-4 ">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-black text-text ">{movementLabel(movement.type)}</Text>
                    <Text className="mt-1 text-sm font-semibold text-muted">
                      {new Date(movement.createdAt).toISOString().slice(0, 10)} · {formatSaleTime(movement.createdAt)}
                    </Text>
                    {movement.reason ? <Text className="mt-1 text-sm font-semibold text-muted">Motivo: {movement.reason}</Text> : null}
                    {movement.supplier ? <Text className="mt-1 text-sm font-semibold text-muted">Proveedor: {movement.supplier}</Text> : null}
                    {movement.invoiceNumber ? <Text className="mt-1 text-sm font-semibold text-muted">Comprobante: {movement.invoiceNumber}</Text> : null}
                    {movement.unitCost ? <Text className="mt-1 text-sm font-semibold text-muted">Costo unitario: {formatCurrency(movement.unitCost)}</Text> : null}
                    {movement.notes ? <Text className="mt-1 text-sm font-semibold text-muted">Obs: {movement.notes}</Text> : null}
                  </View>
                  <View className="rounded-full px-3 py-1" style={{ backgroundColor: colorContainer(c, color) }}>
                    <Text className="font-black" style={{ color }}>{movement.quantity}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScreenScroll>
    </SafeAreaView>
  );
}
