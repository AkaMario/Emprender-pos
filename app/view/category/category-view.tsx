import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
  const router = useRouter();
  const [kind, setKind] = useState<CategoryKind>("product");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setCategories(kind === "product" ? await getProductCategories() : await getInventoryCategories());
  }, [kind]);

  useFocusEffect(useCallback(() => { loadCategories(); }, [loadCategories]));

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
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Revisa el nombre.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(category: ProductCategory) {
    Alert.alert("Eliminar categoria", `¿Eliminar “${category.name}”?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
        try {
          if (kind === "product") await deleteProductCategory(category.id);
          else await deleteInventoryCategory(category.id);
          await loadCategories();
        } catch (error) {
          Alert.alert("No se puede eliminar", error instanceof Error ? error.message : "La categoria esta en uso.");
        }
      } },
    ]);
  }

  const label = kind === "product" ? "producto" : "insumo";

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black">
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="rounded-full p-2"><MaterialIcons name="close" size={28} color="#0f172a" /></Pressable>
        <Text className="text-xl font-black text-slate-950 dark:text-white">Categorias</Text>
      </View>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <View className="flex-row gap-2 rounded-2xl bg-slate-200 p-1 dark:bg-slate-800">
          <Pressable onPress={() => setKind("product")} className={`flex-1 rounded-xl px-3 py-3 ${kind === "product" ? "bg-white dark:bg-slate-700" : ""}`}><Text className="text-center font-black text-slate-800 dark:text-white">Productos</Text></Pressable>
          <Pressable onPress={() => setKind("inventory")} className={`flex-1 rounded-xl px-3 py-3 ${kind === "inventory" ? "bg-white dark:bg-slate-700" : ""}`}><Text className="text-center font-black text-slate-800 dark:text-white">Insumos</Text></Pressable>
        </View>
        <Pressable onPress={openCreate} className="flex-row items-center justify-center gap-2 rounded-2xl bg-orange-700 px-5 py-4">
          <MaterialIcons name="add" size={22} color="white" /><Text className="font-black text-white">Agregar categoria de {label}</Text>
        </Pressable>
        {categories.length === 0 ? <Text className="rounded-2xl bg-white p-5 text-center font-semibold text-slate-500 dark:bg-slate-900">Aun no hay categorias. Agrega la primera para crear {label}s.</Text> : null}
        {categories.map((category) => (
          <View key={category.id} className="flex-row items-center rounded-2xl bg-white p-4 dark:bg-slate-900">
            <Text className="flex-1 text-base font-black text-slate-900 dark:text-white">{category.name}</Text>
            <Pressable onPress={() => openEdit(category)} className="p-2"><MaterialIcons name="edit" size={21} color="#64748b" /></Pressable>
            <Pressable onPress={() => confirmDelete(category)} className="p-2"><MaterialIcons name="delete-outline" size={22} color="#dc2626" /></Pressable>
          </View>
        ))}
      </ScrollView>
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => { setName(""); setEditing(null); setModalVisible(false); }}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full gap-4 rounded-3xl bg-white p-5 dark:bg-slate-900">
            <Text className="text-xl font-black text-slate-950 dark:text-white">{editing ? "Editar categoria" : `Nueva categoria de ${label}`}</Text>
            <TextInput autoFocus value={name} onChangeText={setName} placeholder="Nombre de la categoria" placeholderTextColor="#94a3b8" className="rounded-2xl bg-slate-100 px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-800 dark:text-white" />
            <View className="flex-row justify-end gap-3">
              <Pressable onPress={() => { setName(""); setEditing(null); setModalVisible(false); }} className="rounded-xl px-4 py-3"><Text className="font-bold text-slate-500">Cancelar</Text></Pressable>
              <Pressable disabled={saving} onPress={save} className="rounded-xl bg-orange-700 px-5 py-3"><Text className="font-bold text-white">{saving ? "Guardando..." : "Guardar"}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
