import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import { useAuth } from "@/context/auth";
import { useBusiness } from "@/context/business";
import {
  exportDatabaseFile,
  importDatabaseBackup,
} from "@/database/auth-database";
import { useRouter } from "expo-router";

import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import React from "react";
import { Appearance, Platform, Text, View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function Settings() {
  const { profile, definition, isRestaurant } = useBusiness();
  const { logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Error al cerrar sesion",
        error instanceof Error ? error.message : "Intentalo nuevamente.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleExportDatabase() {
    if (Platform.OS === "web") {
      Alert.alert(
        "No disponible",
        "La exportacion de archivos locales no esta disponible en web.",
      );
      return;
    }

    setExporting(true);

    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          "No disponible",
          "Este dispositivo no puede compartir archivos.",
        );
        return;
      }

      const fileUri = await exportDatabaseFile();

      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Exportar base de datos POS",
        mimeType: "application/vnd.sqlite3",
        UTI: "public.database",
      });
    } catch (error) {
      Alert.alert(
        "Error al exportar",
        error instanceof Error
          ? error.message
          : "No se pudo exportar la base de datos.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleImportDatabase() {
    setImporting(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          "application/vnd.sqlite3",
          "application/x-sqlite3",
          "application/octet-stream",
          "*/*",
        ],
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      if (!file?.uri) {
        Alert.alert(
          "Backup invalido",
          "No se pudo leer el archivo seleccionado.",
        );
        return;
      }

      await importDatabaseBackup(file.uri);
      Alert.alert(
        "Backup importado",
        "La base de datos fue restaurada. Inicia sesion nuevamente.",
      );
      await logout();
    } catch (error) {
      Alert.alert(
        "Error al importar",
        error instanceof Error
          ? error.message
          : "No se pudo importar el backup.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <ScreenScroll
      className="flex-1 bg-surface "
      contentContainerClassName="px-6 py-5"
    >
      <View className="gap-6">
        <View className="gap-2 rounded-none bg-surfaceElevated p-4 ">
          <Text className="text-xl font-bold text-text ">{profile?.name}</Text>
          <Text className="text-base text-text ">{definition?.title}</Text>
        </View>

        <View className="flex flex-col gap-6">

          {isRestaurant && (
            <Pressable
              onPress={() => router.push("/view/category/category-view" as any)}
              className="flex items-start justify-start px-4 py-4 active:bg-primaryContainer w-full border-b border-surfaceElevated"
            >

              <Text className="flex text-base font-semibold text-text justify-start">
                Categorías de productos e insumos
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.push("/view/qr/select-qr" as any)}
            className="flex items-start justify-start px-4 py-4 active:bg-primaryContainer w-full border-b border-surfaceElevated"
          >

            <Text className="text-base font-semibold text-text">
              QR de transferencias
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/view/settings/change-password" as any)}
            className="flex items-start justify-start px-4 py-4 active:bg-primaryContainer w-full border-b border-surfaceElevated"
          >

            <Text className="text-base font-semibold text-text">
              Cambiar contraseña
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/view/settings/change-pin" as any)}
            className="flex items-start justify-start px-4 py-4 active:bg-primaryContainer w-full border-b border-surfaceElevated"
          >
            <Text className="text-base font-semibold text-text">Cambiar PIN</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push("/view/settings/change-security-question" as any)
            }
            className="flex items-start justify-start px-4 py-4 active:bg-primaryContainer w-full border-b border-surfaceElevated"
          >
            <Text className="text-base font-semibold text-text">
              Cambiar pregunta de seguridad
            </Text>
          </Pressable>

          <Pressable
            disabled={exporting}
            onPress={handleExportDatabase}
            className="flex items-start justify-start px-4 py-4 active:bg-primaryContainer w-full border-b border-surfaceElevated"
          >
            <Text className="text-base font-semibold text-text">
              {exporting ? "Exportando..." : "Realizar backup"}
            </Text>
          </Pressable>

          <Pressable
            disabled={importing}
            onPress={handleImportDatabase}
            className="flex items-start justify-start px-4 py-4 active:bg-primaryContainer w-full border-b border-surfaceElevated"
            style={{ opacity: importing ? 0.6 : 1 }}
          >
            <Text className="text-base font-semibold text-text">
              {importing ? "Importando..." : "Importar backup"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: colorScheme === "dark" }}
            onPress={() =>
              Appearance.setColorScheme(colorScheme === "dark" ? "light" : "dark")
            }
            className="flex-row items-start justify-start px-4 py-4 active:bg-primaryContainer w-full border-b border-surfaceElevated"
            style={{ alignItems: "flex-start", justifyContent: "flex-start" }}
          >
            <Text className="text-base font-semibold text-text">
              Modo oscuro
            </Text>
            <Text className="text-base text-muted">
              {colorScheme === "dark" ? " Activado" : " Desactivado"}
            </Text>
          </Pressable>

          <Pressable
            disabled={loggingOut}
            onPress={handleLogout || console.log("Cerrando sesión...")}
            className="flex items-start justify-start px-4 py-4 active:bg-primaryContainer w-full"
            style={{ opacity: loggingOut ? 0.6 : 1 }}
          >
            <Text className="text-base font-semibold text-text">
              {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </Text>
          </Pressable>

        </View>
      </View>
    </ScreenScroll>
  );
}
