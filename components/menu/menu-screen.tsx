import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  deleteOrDeactivateDish,
  formatCurrency,
  getDishes,
  type Dish,
} from "@/database/pos-database";

const categories = ["Todos", "Cocteles", "Especial", "Bebidas"];

export function MenuScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDishes = useCallback(async () => {
    setLoading(true);
    try {
      setDishes(await getDishes({ search, category: selectedCategory }));
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      loadDishes();
    }, [loadDishes])
  );

  function statusColor(status: Dish["stockStatus"]) {
    if (status === "Sin Stock") {
      return "#dc2626";
    }
    if (status === "Bajo Stock") {
      return "#d97706";
    }

    return "#16a34a";
  }

  function confirmDelete(dish: Dish) {
    Alert.alert(
      "Eliminar plato",
      `${dish.name} se eliminara del menu. Si tiene ventas asociadas se desactivara en lugar de eliminarse.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteOrDeactivateDish(dish.id);
            await loadDishes();
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-black"
      contentContainerClassName="px-4 py-5 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-5">

        <Pressable
          onPress={() => router.push("/view/menu/create" as any)}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-orange-700 px-5 py-4 dark:bg-white"
        >
          <MaterialIcons name="add-circle-outline" size={20} className="text-white dark:text-black" color="#FFFFFF" />
          <Text className="text-base font-black text-white dark:text-slate-950">
            Crear nuevo plato
          </Text>
        </Pressable>

        <View className="rounded-2xl bg-white p-3 dark:bg-slate-900">
          <View className="flex-row items-center gap-2 rounded-xl bg-slate-100 px-3 dark:bg-slate-800">
            <MaterialIcons name="search" size={22} color="#64748b" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre o ingrediente"
              placeholderTextColor="#94a3b8"
              className="flex-1 py-3 text-base font-semibold text-slate-950 dark:text-white"
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {categories.map((category) => {
              const selected = selectedCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-3 ${selected ? "bg-slate-950" : "bg-white dark:bg-slate-900"}`}
                >
                  <Text
                    className={`text-sm font-black ${selected ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="gap-3">
          {loading ? (
            <Text className="py-6 text-center text-sm font-semibold text-slate-500">
              Cargando platos...
            </Text>
          ) : null}
          {!loading && dishes.length === 0 ? (
            <Text className="py-6 text-center text-sm font-semibold text-slate-500">
              No hay platos para esta busqueda.
            </Text>
          ) : null}
          {dishes.map((dish) => {
            const color = statusColor(dish.stockStatus);

            return (
            <Pressable
              key={dish.id}
              onPress={() =>
                router.push({
                  pathname: "/view/menu/edit",
                  params: { id: String(dish.id) },
                } as any)
              }
              className="rounded-3xl bg-white p-4 shadow-sm active:opacity-85 dark:bg-slate-900"
              style={{ opacity: dish.stockStatus === "Sin Stock" ? 0.55 : 1 }}
            >
              <View className="flex-row gap-4">
                <View className="h-20 w-20 items-center justify-center rounded-2xl bg-amber-100">
                  <MaterialIcons name="local-bar" size={34} color="#f97316" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-lg font-black text-slate-950 dark:text-white">
                        {dish.name}
                      </Text>
                      <Text className="mt-1 text-sm font-semibold text-slate-500">
                        {dish.description}
                      </Text>
                    </View>
                    <Pressable onPress={() => confirmDelete(dish)} className="p-1">
                      <MaterialIcons name="more-vert" size={22} color="#64748b" />
                    </Pressable>
                  </View>

                  <View className="mt-3 flex-row flex-wrap items-center gap-2">
                    <Text className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {formatCurrency(dish.price)}
                    </Text>
                    <Text className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {dish.size}
                    </Text>
                    <View
                      className="rounded-full px-3 py-1"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Text className="text-xs font-black" style={{ color }}>
                        {dish.stockStatus}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
