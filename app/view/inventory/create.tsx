import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createInventoryItem,
  type InventoryCategory,
  type InventoryUnit,
} from "@/database/pos-database";

const units: InventoryUnit[] = ["kg", "lt", "und", "atado"];
const categories: InventoryCategory[] = ["Fresco", "Congelado", "Bebida", "Otro"];

export default function CreateInventoryItem() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<InventoryUnit>("und");
  const [category, setCategory] = useState<InventoryCategory>("Otro");
  const [initialStock, setInitialStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      Alert.alert("Nombre requerido", "Ingresa el nombre del insumo.");
      return;
    }

    setSaving(true);
    try {
      await createInventoryItem({
        name,
        unit,
        category,
        currentQuantity: Number(initialStock || 0),
        lowStockThreshold: Number(minimumStock || 0),
      });
      Alert.alert("Insumo creado", "El insumo fue agregado al inventario.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo crear el insumo.");
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
        <Text className="text-xl font-black text-slate-950 dark:text-white">Nuevo insumo</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <Field label="Nombre">
          <Input value={name} onChangeText={setName} placeholder="Nombre del insumo" />
        </Field>
        <Field label="Unidad de medida">
          <View className="flex-row flex-wrap gap-2">
            {units.map((item) => <Pill key={item} label={item} selected={unit === item} onPress={() => setUnit(item)} />)}
          </View>
        </Field>
        <Field label="Categoria">
          <View className="flex-row flex-wrap gap-2">
            {categories.map((item) => <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
          </View>
        </Field>
        <Field label="Stock inicial">
          <Input value={initialStock} onChangeText={(value) => setInitialStock(value.replace(/[^0-9.]/g, ""))} placeholder="0" keyboardType="decimal-pad" />
        </Field>
        <Field label="Stock minimo">
          <Input value={minimumStock} onChangeText={(value) => setMinimumStock(value.replace(/[^0-9.]/g, ""))} placeholder="0" keyboardType="decimal-pad" />
        </Field>

        <Pressable disabled={saving} onPress={save} className="rounded-2xl bg-orange-600 px-5 py-4 active:opacity-85">
          <Text className="text-center font-black text-white">{saving ? "Guardando..." : "Guardar insumo"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View className="gap-2"><Text className="text-sm font-black text-slate-600 dark:text-slate-300">{label}</Text>{children}</View>;
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor="#94a3b8" className="rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-900 dark:text-white" {...props} />;
}

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} className={`rounded-full px-4 py-3 ${selected ? "bg-slate-950" : "bg-white dark:bg-slate-900"}`}><Text className={`text-sm font-black ${selected ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{label}</Text></Pressable>;
}
