import { getQrImageUri, saveQrImageUri } from "@/database/pos-database";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectQr() {
  const router = useRouter();
  const [qrUri, setQrUri] = useState<string | null>(null);

  useEffect(() => {
    getQrImageUri().then(setQrUri);
  }, []);

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    await saveQrImageUri(uri);
    setQrUri(uri);
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
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="close" size={28} color="#0f172a" />
        </Pressable>
        {/* <Text className="text-xl font-black text-slate-950 dark:text-white">
          QR de transferencias
        </Text> */}
      </View>

      <View className="flex-1 items-center justify-center gap-8 px-6">
        {qrUri ? (
          <View className="items-center gap-4">
            <Text className="text-base font-bold text-slate-500">
              Imagen actual
            </Text>
            <View className="overflow-hidden rounded-3xl">
              <Image
                source={{ uri: qrUri }}
                style={{ width: 280, height: 280 }}
                contentFit="contain"
              />
            </View>
            <Pressable
              onPress={handleRemove}
              className="flex-row items-center gap-2 rounded-2xl bg-red-50 px-6 py-3"
            >
              <MaterialIcons name="delete-outline" size={20} color="#dc2626" />
              <Text className="font-bold text-red-600">
                Eliminar imagen
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="items-center gap-4">
            <View className="h-32 w-32 items-center justify-center rounded-full bg-slate-100">
              <MaterialIcons name="qr-code" size={64} color="#94a3b8" />
            </View>
            <Text className="text-center text-base font-semibold text-slate-500">
              No hay una imagen QR configurada
            </Text>
          </View>
        )}

        <Pressable
          onPress={handlePickImage}
          className="rounded-2xl bg-orange-600 px-8 py-4 active:opacity-85"
        >
          <Text className="text-center text-base font-black text-white">
            {qrUri ? "Cambiar imagen" : "Seleccionar imagen"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
