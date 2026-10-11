import { SelectionOption as Pill } from "@/components/ui/selection-option";
import { Button } from "@/components/ui/button";
import { colorContainer, useDesignColors } from "@/constants/design";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { LoadFeedback, useLoadFeedback } from "@/components/ui/load-feedback";
import { AppInput } from "@/components/ui/form-input";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { getInventoryCategories, getInventoryItems, type InventoryItem } from "@/database/pos-database";

export function InventoryScreen() {
  const c = useDesignColors();
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<"name" | "stock">("name");
  const [criticalFirst, setCriticalFirst] = useState(true);
  const [filters, setFilters] = useState<string[]>([]);

  const loadItems = useCallback(async () => {
    setItems(await getInventoryItems({ search, category, sortBy, criticalFirst }));
  }, [category, criticalFirst, search, sortBy]);

  const loadStatus = useLoadFeedback(loadItems);
  useFocusEffect(
    useCallback(() => {
      getInventoryCategories().then((categories) => {
        const names = categories.map((item) => item.name);
        setFilters(["Todos", ...names]);
        setCategory((current) => current === "Todos" || names.includes(current) ? current : "Todos");
      }).catch((cause) => Alert.alert("No se pudieron cargar las categorías", cause instanceof Error ? cause.message : "Intenta nuevamente."));

    }, [])
  );

  function statusColor(status: InventoryItem["status"]) {
    if (status === "Critico") {
      return c.error;
    }
    if (status === "Bajo") {
      return c.warning;
    }

    return c.success;
  }

  return (
    <ScreenScroll
      className="flex-1 bg-background "
      contentContainerClassName="gap-5 px-4 py-5 pb-10"
      showsVerticalScrollIndicator={false}
    ><LoadFeedback {...loadStatus} />

      <View className="flex-row flex-wrap gap-3">
        <ActionButton label="Nuevo insumo" onPress={() => router.push("/view/inventory/create" as any)} />
        <ActionButton label="Entrada" onPress={() => router.push("/view/dashboard/supply-entry" as any)} />
        <ActionButton label="Salida" onPress={() => router.push("/view/dashboard/stock-out" as any)} />
      </View>

      <View className="rounded-none bg-surface p-3 ">
        <View className="flex-row items-center gap-2 rounded-none bg-surfaceElevated px-3 ">
          <MaterialIcons name="search" size={22} color={c.icon} />
          <AppInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar insumo"
            className="flex-1 py-3 text-base font-semibold text-text "
          />
        </View>
      </View>

      <ScreenScroll horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {filters.map((item) => (
            <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
          ))}
        </View>
      </ScreenScroll>

      <View className="flex-row flex-wrap gap-2">
        <Pill label="Orden: nombre" selected={sortBy === "name"} onPress={() => setSortBy("name")} />
        <Pill label="Orden: stock" selected={sortBy === "stock"} onPress={() => setSortBy("stock")} />
        <Pill role="checkbox" label="Críticos primero" selected={criticalFirst} onPress={() => setCriticalFirst((value) => !value)} />
      </View>

      <View className="gap-3">
        {items.length === 0 ? (
          <Text className="rounded-none bg-surface p-5 text-center font-semibold text-muted ">
            No hay insumos registrados.
          </Text>
        ) : null}
        {items.map((item) => {
          const color = statusColor(item.status);

          return (
            <Pressable
              key={item.id}
              onPress={() =>
                router.push({ pathname: "/view/inventory/history", params: { id: String(item.id) } } as any)
              }
              className="rounded-none bg-surface p-4  active:bg-surfaceElevated "
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-text ">{item.name}</Text>
                  <Text className="mt-1 text-sm font-semibold text-muted">
                    {item.category} · Min: {item.lowStockThreshold} {item.unit}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-semibold text-text ">
                    {item.currentQuantity} {item.unit}
                  </Text>
                  <View className="mt-2 rounded-none px-3 py-1" style={{ backgroundColor: colorContainer(c, color) }}>
                    <Text className="text-xs font-semibold" style={{ color }}>{item.status}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenScroll>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <View className="min-w-[30%] flex-1"><Button title={label} secondary onPress={onPress} /></View>;
}
