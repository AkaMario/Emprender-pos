import { useDesignColors } from "@/constants/design";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { LoadFeedback, useLoadFeedback } from "@/components/ui/load-feedback";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { Dialog } from "@/components/ui/dialog";
import { Button, Field } from "@/components/business/ui";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createInventoryCategory,
  createProductCategory,
  deleteInventoryCategory,
  deleteProductCategory,
  getInventoryCategories,
  getProductCategories,
  updateInventoryCategory,
  updateProductCategory,
  type ProductCategory,
} from "@/database/pos-database";

type CategoryKind = "product" | "inventory";

export default function CategoryView() {
  const c = useDesignColors();
  const [kind, setKind] = useState<CategoryKind>("product");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setCategories(
      kind === "product"
        ? await getProductCategories()
        : await getInventoryCategories(),
    );
  }, [kind]);

  const loadStatus = useLoadFeedback(loadCategories);

  function openCreate() {
    setEditing(null);
    setName("");
    setModalVisible(true);
  }

  function openEdit(category: ProductCategory) {
    setEditing(category);
    setName(category.name);
    setModalVisible(true);
  }

  async function save() {
    if (saving || !name.trim()) return;
    setSaving(true);
    try {
      if (kind === "product") {
        if (editing) await updateProductCategory(editing.id, name);
        else await createProductCategory(name);
      } else {
        if (editing) await updateInventoryCategory(editing.id, name);
        else await createInventoryCategory(name);
      }
      setName("");
      setEditing(null);
      setModalVisible(false);
      await loadCategories();
    } catch (error) {
      Alert.alert(
        "No se pudo guardar",
        error instanceof Error ? error.message : "Revisa el nombre.",
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(category: ProductCategory) {
    Alert.alert("Eliminar categoria", `¿Eliminar “${category.name}”?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            if (kind === "product") await deleteProductCategory(category.id);
            else await deleteInventoryCategory(category.id);
            await loadCategories();
          } catch (error) {
            Alert.alert(
              "No se puede eliminar",
              error instanceof Error
                ? error.message
                : "La categoria esta en uso.",
            );
          }
        },
      },
    ]);
  }

  const label = kind === "product" ? "producto" : "insumo";

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-background ">
      <ScreenScroll contentContainerClassName="gap-4 p-4 pb-10">
        <LoadFeedback {...loadStatus} />
        <View className="flex-row gap-2 rounded-none bg-surfaceElevated p-1 ">
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: kind === "product" }}
            onPress={() => setKind("product")}
            className={`flex-1 rounded-none px-3 py-3 ${kind === "product" ? "bg-primaryContainer" : ""}`}
          >
            <Text
              className={`text-center font-semibold ${kind === "product" ? "text-link" : "text-text"}`}
            >
              {kind === "product" ? "✓ " : ""}Productos
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: kind === "inventory" }}
            onPress={() => setKind("inventory")}
            className={`flex-1 rounded-none px-3 py-3 ${kind === "inventory" ? "bg-primaryContainer" : ""}`}
          >
            <Text
              className={`text-center font-semibold ${kind === "inventory" ? "text-link" : "text-text"}`}
            >
              {kind === "inventory" ? "✓ " : ""}Insumos
            </Text>
          </Pressable>
        </View>
        <Button
          title={`Agregar categoría de ${label}`}
          onPress={openCreate}
          icon={(color) => <MaterialIcons name="add" size={22} color={color} />}
        />
        {categories.length === 0 ? (
          <Text className="rounded-none bg-surface p-5 text-center font-semibold text-muted ">
            Aun no hay categorias. Agrega la primera para crear {label}s.
          </Text>
        ) : null}
        {categories.map((category) => (
          <View
            key={category.id}
            className="flex-row items-center rounded-none bg-surface p-4 "
          >
            <Text className="flex-1 text-base font-semibold text-text ">
              {category.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar ${category.name}`}
              style={{
                minWidth: 48,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => openEdit(category)}
              className="p-2"
            >
              <MaterialIcons name="edit" size={21} color={c.icon} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Eliminar ${category.name}`}
              style={{
                minWidth: 48,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => confirmDelete(category)}
              className="p-2"
            >
              <MaterialIcons name="delete-outline" size={22} color={c.error} />
            </Pressable>
          </View>
        ))}
      </ScreenScroll>
      <Dialog
        visible={modalVisible}
        title={editing ? "Editar categoría" : `Nueva categoría de ${label}`}
        busy={saving}
        dirty={name !== (editing?.name ?? "")}
        onClose={() => {
          setName("");
          setEditing(null);
          setModalVisible(false);
        }}
      >
        <Field
          label="Nombre de la categoría"
          required
          autoFocus
          value={name}
          onChangeText={setName}
          editable={!saving}
        />
        <Button
          title="Guardar categoría"
          loading={saving}
          disabled={!name.trim()}
          onPress={save}
        />
      </Dialog>
    </SafeAreaView>
  );
}
