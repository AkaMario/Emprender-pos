import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { getInventoryItems, type InventoryItem } from "@/database/pos-database";

const filters = ["Todos", "Fresco", "Congelado", "Bebida"];

export function InventoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<"name" | "stock">("name");
  const [criticalFirst, setCriticalFirst] = useState(true);

  const loadItems = useCallback(async () => {
    setItems(await getInventoryItems({ search, category, sortBy, criticalFirst }));
  }, [category, criticalFirst, search, sortBy]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  function statusColor(status: InventoryItem["status"]) {
    if (status === "Critico") {
      return "#dc2626";
    }
    if (status === "Bajo") {
      return "#d97706";
    }

    return "#16a34a";
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-black"
      contentContainerClassName="gap-5 px-4 py-5 pb-10"
      showsVerticalScrollIndicator={false}
    >

      <View className="flex-row flex-wrap gap-3">
        <ActionButton label="Nuevo insumo" icon="add-box" onPress={() => router.push("/view/inventory/create" as any)} />
        <ActionButton label="Entrada" icon="inventory" onPress={() => router.push("/view/dashboard/supply-entry" as any)} />
        <ActionButton label="Salida" icon="remove-shopping-cart" onPress={() => router.push("/view/dashboard/stock-out" as any)} />
      </View>

      <View className="rounded-2xl bg-white p-3 dark:bg-slate-900">
        <View className="flex-row items-center gap-2 rounded-xl bg-slate-100 px-3 dark:bg-slate-800">
          <MaterialIcons name="search" size={22} color="#64748b" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar insumo"
            placeholderTextColor="#94a3b8"
            className="flex-1 py-3 text-base font-semibold text-slate-950 dark:text-white"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {filters.map((item) => (
            <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
          ))}
        </View>
      </ScrollView>

      <View className="flex-row flex-wrap gap-2">
        <Pill label="Orden: nombre" selected={sortBy === "name"} onPress={() => setSortBy("name")} />
        <Pill label="Orden: stock" selected={sortBy === "stock"} onPress={() => setSortBy("stock")} />
        <Pill label="Criticos primero" selected={criticalFirst} onPress={() => setCriticalFirst((value) => !value)} />
      </View>

      <View className="gap-3">
        {items.length === 0 ? (
          <Text className="rounded-2xl bg-white p-5 text-center font-semibold text-slate-500 dark:bg-slate-900">
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
              className="rounded-3xl bg-white p-4 shadow-sm active:opacity-85 dark:bg-slate-900"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-black text-slate-950 dark:text-white">{item.name}</Text>
                  <Text className="mt-1 text-sm font-semibold text-slate-500">
                    {item.category} · Min: {item.lowStockThreshold} {item.unit}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-black text-slate-950 dark:text-white">
                    {item.currentQuantity} {item.unit}
                  </Text>
                  <View className="mt-2 rounded-full px-3 py-1" style={{ backgroundColor: `${color}20` }}>
                    <Text className="text-xs font-black" style={{ color }}>{item.status}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ActionButton({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="min-w-[30%] flex-1 rounded-2xl bg-orange-700 p-4 active:opacity-85">
      <MaterialIcons name={icon as any} size={24} color="white" />
      <Text className="mt-2 font-black text-white">{label}</Text>
    </Pressable>
  );
}

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`rounded-full px-4 py-3 ${selected ? "bg-slate-950" : "bg-white dark:bg-slate-900"}`}>
      <Text className={`text-sm font-black ${selected ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{label}</Text>
    </Pressable>
  );
}
