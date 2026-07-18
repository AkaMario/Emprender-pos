import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getDishById,
  getDishRecipeItems,
  getInventoryItems,
  getProductCategories,
  upsertDish,
  type DishCategory,
  type InventoryItem,
} from "@/database/pos-database";

const sizes = ["5oz", "8oz", "10oz", "12oz", "14oz", "16oz"];

interface DishFormScreenProps {
  mode: "create" | "edit";
}

export function DishFormScreen({ mode }: DishFormScreenProps) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = mode === "edit";
  const dishId = Number(id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("10oz");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recipeQuantities, setRecipeQuantities] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const [items, productCategories] = await Promise.all([getInventoryItems(), getProductCategories()]);
      if (!mounted) {
        return;
      }
      setInventoryItems(items);
      setCategories(productCategories.map((item) => item.name));
      if (!isEdit && productCategories[0]) setCategory(productCategories[0].name);

      if (!isEdit || !dishId) {
        return;
      }

      const [dish, recipeItems] = await Promise.all([
        getDishById(dishId),
        getDishRecipeItems(dishId),
      ]);
      if (!mounted || !dish) {
        return;
      }

      setName(dish.name);
      setDescription(dish.description);
      setPrice(String(dish.price));
      setCategory(dish.category);
      setSize(dish.size);
      setImageUri(dish.imageUri);
      setRecipeQuantities(
        recipeItems.reduce<Record<number, string>>((result, item) => {
          result[item.inventoryItemId] = String(item.quantity);
          return result;
        }, {})
      );
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [dishId, isEdit]);

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return;

    setImageUri(result.assets[0].uri);
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Se necesita acceso a la camara para tomar una foto.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return;

    setImageUri(result.assets[0].uri);
  }

  function handleImagePress() {
    Alert.alert("Imagen del plato", "Selecciona una opcion", [
      { text: "Tomar foto", onPress: handleTakePhoto },
      { text: "Seleccionar de galeria", onPress: handlePickImage },
      ...(imageUri ? [{ text: "Eliminar imagen", style: "destructive" as const, onPress: () => setImageUri(null) }] : []),
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function updatePrice(value: string) {
    setPrice(value.replace(/[^0-9]/g, ""));
  }

  async function saveDish() {
    if (!name.trim() || !price.trim() || !category) {
      Alert.alert("Campos requeridos", "Nombre, precio y una categoria son obligatorios. Crea una categoria desde Configuraciones si aún no existe.");
      return;
    }

    setSaving(true);
    try {
      await upsertDish({
        id: isEdit ? dishId : undefined,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        size,
        imageUri,
        recipeItems: Object.entries(recipeQuantities)
          .map(([inventoryItemId, quantity]) => ({
            inventoryItemId: Number(inventoryItemId),
            quantity: Number(quantity),
          }))
          .filter((item) => item.quantity > 0),
      });

      Alert.alert(isEdit ? "Plato actualizado" : "Plato creado", "El menu fue actualizado.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo guardar.");
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
        <View className="flex-1">
          <Text className="text-xl font-black text-slate-950 dark:text-white">
            {isEdit ? "Editar plato" : "Crear plato"}
          </Text>
          {isEdit ? (
            <Text className="text-sm font-semibold text-slate-500">ID no editable: {id}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <View className="rounded-3xl bg-white p-4 dark:bg-slate-900">
          <Text className="text-sm font-black text-slate-500">Imagen del plato</Text>
          <Pressable
            onPress={handleImagePress}
            className="mt-3 h-32 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <>
                <MaterialIcons name="add-photo-alternate" size={34} color="#f97316" />
                <Text className="mt-2 text-sm font-bold text-slate-500">Asociar imagen opcional</Text>
              </>
            )}
          </Pressable>
        </View>

        <Field label="Nombre">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre del plato"
            placeholderTextColor="#94a3b8"
            className="rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-900 dark:text-white"
          />
        </Field>

        <Field label="Descripcion">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ingredientes principales y notas del plato"
            placeholderTextColor="#94a3b8"
            multiline
            className="min-h-24 rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-900 dark:text-white"
            textAlignVertical="top"
          />
        </Field>

        <Field label="Precio">
          <TextInput
            value={price}
            onChangeText={updatePrice}
            keyboardType="number-pad"
            placeholder="Solo numeros positivos"
            placeholderTextColor="#94a3b8"
            className="rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-900 dark:text-white"
          />
        </Field>

        <Field label="Categoria">
          <View className="flex-row flex-wrap gap-2">
            {categories.length === 0 ? <Text className="text-sm font-semibold text-red-600">No hay categorias creadas. Agrega una desde Configuraciones.</Text> : null}
            {categories.map((item) => (
              <ChoicePill
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
              />
            ))}
          </View>
        </Field>

        <Field label="Tamano">
          <View className="flex-row flex-wrap gap-2">
            {sizes.map((item) => (
              <ChoicePill
                key={item}
                label={item}
                selected={size === item}
                onPress={() => setSize(item)}
              />
            ))}
          </View>
        </Field>

        <Field label="Receta">
          <View className="gap-2">
            {inventoryItems.length === 0 ? (
              <Text className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 dark:bg-slate-900">
                Registra insumos en Entrada de Insumos antes de asociar una receta.
              </Text>
            ) : null}
            {inventoryItems.map((item) => (
              <View key={item.id} className="flex-row items-center gap-3 rounded-2xl bg-white p-3 dark:bg-slate-900">
                <View className="flex-1">
                  <Text className="font-black text-slate-950 dark:text-white">{item.name}</Text>
                  <Text className="text-xs font-semibold text-slate-500">Unidad: {item.unit}</Text>
                </View>
                <TextInput
                  value={recipeQuantities[item.id] ?? ""}
                  onChangeText={(value) =>
                    setRecipeQuantities((current) => ({
                      ...current,
                      [item.id]: value.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                  className="w-24 rounded-xl bg-slate-100 px-3 py-3 text-center font-bold text-slate-950 dark:bg-slate-800 dark:text-white"
                />
              </View>
            ))}
          </View>
        </Field>

        <Pressable
          onPress={saveDish}
          className="mt-2 rounded-2xl bg-amber-500 px-5 py-4 active:opacity-85"
        >
          <Text className="text-center text-base font-black text-white">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar plato"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-black text-slate-600 dark:text-slate-300">{label}</Text>
      {children}
    </View>
  );
}

function ChoicePill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-3 ${selected ? "bg-slate-950" : "bg-white dark:bg-slate-900"}`}
    >
      <Text
        className={`text-sm font-black ${selected ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
