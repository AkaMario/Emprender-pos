import { Button } from "@/components/ui/button";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { useFormProtection } from "@/hooks/use-form-protection";
import { FieldGroup as Field, AppInput } from "@/components/ui/form-input";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createInventoryItem,
  getInventoryCategories,
  type InventoryCategory,
  type InventoryUnit,
} from "@/database/pos-database";

const units: InventoryUnit[] = ["kg", "lt", "und", "atado"];

export default function CreateInventoryItem() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<InventoryUnit>("und");
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [category, setCategory] = useState<InventoryCategory>("");
  const [initialStock, setInitialStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [saving, setSaving] = useState(false);

  const { dialog, markSaved } = useFormProtection([name, unit, initialStock, minimumStock], saving, true);
  useEffect(() => {
    getInventoryCategories().then((items) => {
      const names = items.map((item) => item.name);
      setCategories(names);
      setCategory(names[0] ?? "");
    }).catch((cause) => Alert.alert("No se pudieron cargar las categorías", cause instanceof Error ? cause.message : "Intenta nuevamente."));
  }, []);

  const [attempted, setAttempted] = useState(false);
  const stockError = (value: string) => Number.isFinite(Number(value || 0)) && Number(value || 0) >= 0 ? '' : 'Ingresa una cantidad válida mayor o igual a cero.';
  async function save() {
    if (saving) return;
    setAttempted(true);
    if (stockError(initialStock) || stockError(minimumStock)) return;
    if (!name.trim() || !category) {
      Alert.alert("Campos requeridos", "Ingresa el nombre y selecciona una categoria de insumo. Créala desde Configuraciones si aún no existe.");
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
      markSaved();
      Alert.alert("Insumo creado", "El insumo fue agregado al inventario.", [
        { text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace("/") },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo crear el insumo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-background ">{dialog}


      <ScreenScroll contentContainerClassName="gap-4 p-4 pb-10">
        <Field label="Nombre *" error={attempted && !name.trim() ? "Escribe el nombre del insumo." : undefined}>
          <Input value={name} onChangeText={setName} placeholder="Nombre del insumo" />
        </Field>
        <Field label="Unidad de medida">
          <View className="flex-row flex-wrap gap-2">
            {units.map((item) => <Pill key={item} label={item} selected={unit === item} onPress={() => setUnit(item)} />)}
          </View>
        </Field>
        <Field label="Categoría *" error={attempted && !category ? "Selecciona una categoría." : undefined}>
          <View className="flex-row flex-wrap gap-2">
            {categories.length === 0 ? <Text className="text-sm font-semibold text-error">No hay categorias de insumos. Agrega una desde Configuraciones.</Text> : null}
            {categories.map((item) => <Pill key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
          </View>
        </Field>
        <Field label="Stock inicial" error={attempted ? stockError(initialStock) : undefined}>
          <Input value={initialStock} onChangeText={(value) => setInitialStock(value.replace(/[^0-9.]/g, ""))} placeholder="0" keyboardType="decimal-pad" />
        </Field>
        <Field label="Stock mínimo" error={attempted ? stockError(minimumStock) : undefined}>
          <Input value={minimumStock} onChangeText={(value) => setMinimumStock(value.replace(/[^0-9.]/g, ""))} placeholder="0" keyboardType="decimal-pad" />
        </Field>

        <Button title="Guardar insumo" loading={saving} onPress={save} />
      </ScreenScroll>
    </SafeAreaView>
  );
}


function Input(props: React.ComponentProps<typeof AppInput>) {
  return <AppInput className="rounded-2xl bg-surface px-4 py-4 text-base font-semibold text-text " {...props} />;
}

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} className={`rounded-full px-4 py-3 ${selected ? "bg-primary" : "bg-surface "}`}><Text className={`text-sm font-black ${selected ? "text-onPrimary" : "text-text "}`}>{label}</Text></Pressable>;
}
