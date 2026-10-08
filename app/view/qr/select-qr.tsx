import { Button } from "@/components/ui/button";
import { useDesignColors } from "@/constants/design";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { getQrImageUri, saveQrImageUri } from "@/database/pos-database";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectQr() {
  const c = useDesignColors();
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [qrUri, setQrUri] = useState<string | null>(null);

  useEffect(() => {
    void getQrImageUri().then(setQrUri).catch((cause) => Alert.alert("No se pudo cargar el QR", cause instanceof Error ? cause.message : "Intenta nuevamente."));
  }, []);

  async function handlePickImage() {
    if (busy) return;
    setBusy(true);
    try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    await saveQrImageUri(uri);
    setQrUri(uri);
    } catch (cause) { Alert.alert("No se pudo guardar el QR", cause instanceof Error ? cause.message : "Intenta nuevamente."); }
    finally { setBusy(false); }
  }

  async function handleRemove() {
    Alert.alert(
      "Eliminar QR",
      "¿Eliminar la imagen QR de transferencias?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await saveQrImageUri(null);
            setQrUri(null);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-surface ">


      <View className="flex-1 items-center justify-center gap-8 px-6">
        {qrUri ? (
          <View className="items-center gap-4">
            <Text className="text-base font-bold text-muted">
              Imagen actual
            </Text>
            <View className="overflow-hidden rounded-3xl">
              <Image
                source={{ uri: qrUri }}
                style={{ width: Math.min(280, width - 64), height: Math.min(280, width - 64) }}
                contentFit="contain"
              />
            </View>
            <Button title="Eliminar imagen" variant="destructive" loading={busy} onPress={handleRemove} icon={(color) => <MaterialIcons name="delete-outline" size={20} color={color} />} />
          </View>
        ) : (
          <View className="items-center gap-4">
            <View className="h-32 w-32 items-center justify-center rounded-full bg-surfaceElevated">
              <MaterialIcons name="qr-code" size={64} color={c.icon} />
            </View>
            <Text className="text-center text-base font-semibold text-muted">
              No hay una imagen QR configurada
            </Text>
          </View>
        )}

        <Button title={qrUri ? "Cambiar imagen" : "Seleccionar imagen"} loading={busy} onPress={handlePickImage} />
      </View>
    </SafeAreaView>
  );
}
