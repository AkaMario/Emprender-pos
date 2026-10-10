import { Button } from "@/components/ui/button";
import { colorContainer, useDesignColors } from "@/constants/design";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { LoadFeedback, useLoadFeedback } from "@/components/ui/load-feedback";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { AppInput } from "@/components/ui/form-input";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Text,
  View,
} from "react-native";
import {
  deleteOrDeactivateDish,
  formatCurrency,
  getDishes,
  getProductCategories,
  type Dish,
} from "@/database/pos-database";

export function MenuScreen() {
  const c = useDesignColors();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const loadDishes = useCallback(async () => {
    setDishes(await getDishes({ search, category: selectedCategory }));
  }, [search, selectedCategory]);

  const loadStatus = useLoadFeedback(loadDishes);
  useFocusEffect(
    useCallback(() => {
      getProductCategories().then((items) => {
        setCategories(items.map((item) => item.name));
        setSelectedCategory((current) => current === "Todos" || items.some((item) => item.name === current) ? current : "Todos");
      }).catch((cause) => Alert.alert("No se pudieron cargar las categorías", cause instanceof Error ? cause.message : "Intenta nuevamente."));

    }, [])
  );

  function statusColor(status: Dish["stockStatus"]) {
    if (status === "Sin Stock") {
      return c.error;
    }
    if (status === "Bajo Stock") {
      return c.warning;
    }

    return c.success;
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
    <ScreenScroll
      className="flex-1 bg-background "
      contentContainerClassName="px-4 py-5 pb-10"
      showsVerticalScrollIndicator={false}
    ><LoadFeedback {...loadStatus} />
      <View className="gap-5">

        <Button title="Crear nuevo plato" onPress={() => router.push("/view/menu/create" as any)} icon={(color) => <MaterialIcons name="add-circle-outline" size={20} color={color} />} />

        <View className="rounded-none bg-surface p-3 ">
          <View className="flex-row items-center gap-2 rounded-none bg-surfaceElevated px-3 ">
            <MaterialIcons name="search" size={22} color={c.icon} />
            <AppInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre o ingrediente"
              className="flex-1 py-3 text-base font-semibold text-text "
            />
          </View>
        </View>

        <ScreenScroll horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {categories.map((category) => {
              const selected = selectedCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`rounded-none px-4 py-3 ${selected ? "bg-primary" : "bg-surface "}`}
                >
                  <Text
                    className={`text-sm font-semibold ${selected ? "text-onPrimary" : "text-text "}`}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScreenScroll>

        <View className="gap-3">
          {!loadStatus.loading && !loadStatus.error && dishes.length === 0 ? (
            <Text className="py-6 text-center text-sm font-semibold text-muted">
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
              className="rounded-none bg-surface p-4  active:bg-surfaceElevated "
            >
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-text ">
                        {dish.name}
                      </Text>
                      <Text className="mt-1 text-sm font-semibold text-muted">
                        {dish.description}
                      </Text>
                    </View>
                    <Pressable accessibilityLabel={`Eliminar ${dish.name}`} onPress={(event) => { event.stopPropagation(); confirmDelete(dish); }} className="p-1">
                      <Text className="text-sm font-semibold text-error">Eliminar</Text>
                    </Pressable>
                  </View>

                  <View className="mt-3 flex-row flex-wrap items-center gap-2">
                    <Text className="rounded-none bg-surfaceElevated px-3 py-1 text-xs font-semibold text-text">
                      {formatCurrency(dish.price)}
                    </Text>
                    {dish.size ? (
                      <Text className="rounded-none bg-surfaceElevated px-3 py-1 text-xs font-semibold text-text">
                        {dish.size}
                      </Text>
                    ) : null}
                    <View
                      className="rounded-none px-3 py-1"
                      style={{ backgroundColor: colorContainer(c, color) }}
                    >
                      <Text className="text-xs font-semibold" style={{ color }}>
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
    </ScreenScroll>
  );
}
