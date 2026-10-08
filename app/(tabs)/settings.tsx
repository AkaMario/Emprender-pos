import { useAuth } from "@/context/auth";
import { useBusiness } from "@/context/business";
import {
  exportDatabaseFile,
  importDatabaseBackup,
} from "@/database/auth-database";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function Settings() {
  const { profile, definition, isRestaurant } = useBusiness();
  const { logout } = useAuth();
  const router = useRouter();
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
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="px-6 py-5"
    >
      <View className="gap-12">
        <View className="gap-2 rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
          <Text className="text-xl font-bold text-slate-950 dark:text-white">{profile?.name}</Text>
          <Text className="text-base text-slate-700 dark:text-slate-200">{definition?.title}</Text>
          <Text className="text-sm text-slate-500">Un solo tipo de emprendimiento por base de datos.</Text>
        </View>
        {isRestaurant && <Pressable
          onPress={() => router.push("/view/category/category-view" as any)}
          className="flex-row items-center gap-4"
        >
          <MaterialIcons name="category" size={24} color="black" />

          <Text className="text-lg font-bold text-slate-900">
            Categorias de productos e insumos
          </Text>
        </Pressable>}

        <Pressable
          onPress={() => router.push("/view/qr/select-qr" as any)}
          className="flex-row items-center gap-4"
        >
          <MaterialCommunityIcons name="qrcode" size={24} color="black" />

          <Text className="text-lg font-bold text-slate-900">
            QR de transferecias
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/view/settings/change-password" as any)}
          className="flex-row items-center gap-4"
        >
          <MaterialCommunityIcons
            name="form-textbox-password"
            size={24}
            color="black"
          />

          <Text className="text-lg font-bold text-slate-900">
            Cambiar contraseña
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/view/settings/change-pin" as any)}
          className="flex-row items-center gap-4"
        >
          <MaterialIcons name="password" size={24} color="black" />
          <Text className="text-lg font-bold text-slate-900">Cambiar PIN</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push("/view/settings/change-security-question" as any)
          }
          className="flex-row items-center gap-4"
        >
          <MaterialCommunityIcons
            name="head-question-outline"
            size={24}
            color="black"
          />
          <Text className="text-lg font-bold text-slate-900">
            Cambiar pregunta de seguridad
          </Text>
        </Pressable>
        <Pressable
          disabled={exporting}
          onPress={handleExportDatabase}
          className="flex-row items-center gap-4"
        >
          <MaterialIcons
            name="settings-backup-restore"
            size={24}
            color="black"
          />
          <Text className="text-lg font-bold text-slate-900">
            {exporting ? "Exportando..." : "Realizar backup"}
          </Text>
        </Pressable>

        <Pressable
          disabled={importing}
          onPress={handleImportDatabase}
          className="flex-row items-center gap-4"
          style={{ opacity: importing ? 0.6 : 1 }}
        >
          <MaterialIcons name="restore" size={24} color="black" />
          <Text className="text-lg font-bold text-slate-900">
            {importing ? "Importando..." : "Importar backup"}
          </Text>
        </Pressable>

        <Pressable
          disabled={loggingOut}
          onPress={handleLogout || console.log("Cerrando sesion...")}
          className="flex-row items-center gap-4"
          style={{ opacity: loggingOut ? 0.6 : 1 }}
        >
          <MaterialIcons name="logout" size={24} color="black" />
          <Text className="text-lg font-bold text-slate-900">
            {loggingOut ? "Cerrando sesion..." : "Cerrar sesion"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
