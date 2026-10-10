import { Button } from "@/components/ui/button";
import { useDesignColors } from "@/constants/design";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { useFormProtection } from "@/hooks/use-form-protection";
import { FieldGroup as Field, AppInput } from "@/components/ui/form-input";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Text,
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

const presentations = ["Unidad", "Porción", "Personal", "Para compartir", "Familiar"];

interface DishFormScreenProps {
  mode: "create" | "edit";
}

export function DishFormScreen({ mode }: DishFormScreenProps) {
  const c = useDesignColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = mode === "edit";
  const dishId = Number(id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [category, setCategory] = useState("");
  const [presentation, setPresentation] = useState("");
  const [customPresentation, setCustomPresentation] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recipeQuantities, setRecipeQuantities] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const [formLoading, setFormLoading] = useState(true);
  const { dialog, markSaved } = useFormProtection([name, description, price, category, presentation, customPresentation, imageUri, recipeQuantities], saving, !formLoading);
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
      setPresentation(dish.size);
      setCustomPresentation(Boolean(dish.size) && !presentations.includes(dish.size));
      setImageUri(dish.imageUri);
      setRecipeQuantities(
        recipeItems.reduce<Record<number, string>>((result, item) => {
          result[item.inventoryItemId] = String(item.quantity);
          return result;
        }, {})
      );
    }

    void loadData().catch((error) => { Alert.alert("No se pudo cargar", error instanceof Error ? error.message : "Intenta nuevamente."); }).finally(() => { if (mounted) setFormLoading(false); });

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

  const [attempted, setAttempted] = useState(false);
  const fieldErrors = attempted ? {
    name: name.trim() ? '' : 'Escribe el nombre del plato.',
    price: price.trim() && Number.isFinite(Number(price)) && Number(price) >= 0 ? '' : 'Ingresa un precio válido en COP.',
    category: category ? '' : 'Selecciona una categoría.',
  } : { name: '', price: '', category: '' };
  async function saveDish() {
    if (saving || formLoading) return;
    setAttempted(true);
    if (!name.trim() || !price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0 || !category) {
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
        size: presentation.trim(),
        imageUri,
        recipeItems: Object.entries(recipeQuantities)
          .map(([inventoryItemId, quantity]) => ({
            inventoryItemId: Number(inventoryItemId),
            quantity: Number(quantity),
          }))
          .filter((item) => item.quantity > 0),
      });

      markSaved();
      Alert.alert(isEdit ? "Plato actualizado" : "Plato creado", "El menu fue actualizado.", [
        { text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace("/") },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-background ">{dialog}


      <ScreenScroll contentContainerClassName="gap-4 p-4 pb-10">
        <View className="rounded-none bg-surface p-4 ">
          <Text className="text-sm font-semibold text-muted">Imagen del plato</Text>
          <Pressable
            onPress={handleImagePress}
            className="mt-3 h-32 items-center justify-center overflow-hidden rounded-none border border-dashed border-border bg-background "
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <>
                <MaterialIcons name="add-photo-alternate" size={34} color={c.primary} />
                <Text className="mt-2 text-sm font-bold text-muted">Asociar imagen opcional</Text>
              </>
            )}
          </Pressable>
        </View>

        <Field label="Nombre *" error={fieldErrors.name}>
          <AppInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre del plato"
            className="rounded-none bg-surface px-4 py-4 text-base font-semibold text-text "
          />
        </Field>

        <Field label="Descripcion">
          <AppInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ingredientes principales y notas del plato"
            multiline
            className="min-h-24 rounded-none bg-surface px-4 py-4 text-base font-semibold text-text "
            textAlignVertical="top"
          />
        </Field>

        <Field label="Precio en COP *" error={fieldErrors.price}>
          <AppInput
            value={price}
            onChangeText={updatePrice}
            keyboardType="number-pad"
            placeholder="Solo numeros positivos"
            className="rounded-none bg-surface px-4 py-4 text-base font-semibold text-text "
          />
        </Field>

        <Field label="Categoría *" error={fieldErrors.category}>
          <View className="flex-row flex-wrap gap-2">
            {categories.length === 0 ? <Text className="text-sm font-semibold text-error">No hay categorias creadas. Agrega una desde Configuraciones.</Text> : null}
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

        <Field label="Presentación (opcional)">
          <View className="flex-row flex-wrap gap-2">
            <ChoicePill
              label="Sin especificar"
              selected={!customPresentation && !presentation}
              onPress={() => { setCustomPresentation(false); setPresentation(""); }}
            />
            {presentations.map((item) => (
              <ChoicePill
                key={item}
                label={item}
                selected={!customPresentation && presentation === item}
                onPress={() => { setCustomPresentation(false); setPresentation(item); }}
              />
            ))}
            <ChoicePill
              label="Personalizada"
              selected={customPresentation}
              onPress={() => {
                if (!customPresentation) setPresentation("");
                setCustomPresentation(true);
              }}
            />
          </View>
          {customPresentation ? (
            <AppInput
              value={presentation}
              onChangeText={setPresentation}
              accessibilityLabel="Presentación personalizada"
              placeholder="Ej.: Vaso de 12 oz, Botella de 500 ml o 250 g"
              className="rounded-none bg-surface px-4 py-4 text-base font-semibold text-text "
            />
          ) : null}
          <Text className="text-sm font-semibold text-muted">
            Describe lo que recibe el cliente. El consumo de insumos se define en la receta.
          </Text>
          <Text className="text-sm font-semibold text-muted">
            Si cambian el precio o la receta, crea un plato por cada presentación.
          </Text>
        </Field>

        <Field label="Receta">
          <View className="gap-2">
            {inventoryItems.length === 0 ? (
              <Text className="rounded-none bg-surface p-4 text-sm font-semibold text-muted ">
                Registra insumos en Entrada de Insumos antes de asociar una receta.
              </Text>
            ) : null}
            {inventoryItems.map((item) => (
              <View key={item.id} className="flex-row items-center gap-3 rounded-none bg-surface p-3 ">
                <View className="flex-1">
                  <Text className="font-semibold text-text ">{item.name}</Text>
                  <Text className="text-xs font-semibold text-muted">Unidad: {item.unit}</Text>
                </View>
                <AppInput
                  value={recipeQuantities[item.id] ?? ""}
                  onChangeText={(value) =>
                    setRecipeQuantities((current) => ({
                      ...current,
                      [item.id]: value.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  placeholder="0"
                  keyboardType="decimal-pad"
                  accessibilityLabel={`Cantidad de ${item.name} en ${item.unit}`}
                  className="w-24 rounded-none bg-surfaceElevated px-3 py-3 text-center font-bold text-text "
                />
              </View>
            ))}
          </View>
        </Field>

        <Button title={isEdit ? "Guardar cambios" : "Guardar plato"} loading={saving} disabled={formLoading} onPress={saveDish} />
      </ScreenScroll>
    </SafeAreaView>
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
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`rounded-none px-4 py-3 ${selected ? "bg-primary" : "bg-surface "}`}
    >
      <Text
        className={`text-sm font-semibold ${selected ? "text-onPrimary" : "text-text "}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
