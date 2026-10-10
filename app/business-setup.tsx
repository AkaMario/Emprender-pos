import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import { useBusiness } from "@/context/business";
import { useAuth } from "@/context/auth";
import { BUSINESS_MODELS, type BusinessModel } from "@/domain/business";
import { hasRestaurantData } from "@/database/business-database";
import {
  Button,
  Card,
  Copy,
  ErrorText,
  Field,
  Heading,
  Page,
  errorMessage,
} from "@/components/business/ui";

export default function BusinessSetup() {
  const { choose } = useBusiness();
  const { logout } = useAuth();
  const [name, setName] = useState("");
  const [model, setModel] = useState<BusinessModel | null>(null);
  const [legacy, setLegacy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    hasRestaurantData()
      .then((found) => {
        if (mounted) {
          setLegacy(found);
          if (found) setModel("restaurant");
        }
      })
      .catch((cause) => {
        if (mounted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  async function submit() {
    if (!model) return;
    setError("");
    setSaving(true);
    try {
      await choose({ name, model });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-background ">
      <Page>
        <Heading>Configura tu emprendimiento</Heading>
        <Copy>
          Elige un solo tipo. Adaptaremos el catálogo, las ventas y la operación
          de tu negocio.
        </Copy>
        <Field
          label="Nombre del emprendimiento"
          value={name}
          onChangeText={setName}
          placeholder="Mi emprendimiento"
          maxLength={100}
        />
        {legacy && (
          <Card>
            <Copy>
              Encontramos datos del POS de restaurante. Continúa con restaurante
              para conservar tu catálogo, inventario y ventas.
            </Copy>
          </Card>
        )}
        {(Object.keys(BUSINESS_MODELS) as BusinessModel[]).map((key) => {
          const option = BUSINESS_MODELS[key];
          const selected = key === model;
          const disabled =
            saving || checking || (legacy && key !== "restaurant");
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => setModel(key)}
              className={`gap-2 rounded-none border-2 p-4 ${selected ? "border-border bg-primaryContainer " : "border-separator bg-surface "}`}
              style={{ opacity: disabled ? 0.5 : 1 }}
            >
              <View className="flex-row items-center gap-3">
                <Text className="flex-1 text-lg font-bold text-text ">
                  {option.title}
                </Text>
                {selected && (
                  <Text className="text-sm font-semibold text-text">Elegido</Text>
                )}
              </View>
              <Copy>{option.description}</Copy>
            </Pressable>
          );
        })}
        <Copy>
          La elección queda vinculada a esta base de datos para mantener una
          operación coherente.
        </Copy>
        <ErrorText message={error} />
        <Button
          title={saving ? "Guardando…" : "Comenzar"}
          disabled={saving || checking || !model || !name.trim()}
          onPress={submit}
        />
        <Button
          title="Cerrar sesión"
          secondary
          disabled={saving}
          onPress={() => {
            logout().catch((cause) => setError(errorMessage(cause)));
          }}
        />
      </Page>
    </SafeAreaView>
  );
}
