import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { getUnreadAlertsCount } from "@/database/pos-database";

interface NavbarProps {
  title?: string;
  onMenuPress?: () => void;
}

export function Navbar({ title = "Bienvenido", onMenuPress }: NavbarProps) {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/" || pathname.includes("index");
  const isDashboard = pathname.includes("dashboard");
  const isMenu = pathname.includes("menu");
  const isSales = pathname.includes("sales");
  const isReports = pathname.includes("reports");
  const isInventory = pathname.includes("inventory");
  const isSettings = pathname.includes("settings");
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark
    ? Colors.dark.background
    : Colors.light.background;
  const textColor = isDark ? "#fff" : "#000";

  const { username } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  const loadAlertCount = useCallback(async () => {
    setAlertCount(await getUnreadAlertsCount());
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadFocusedAlertCount() {
        const count = await getUnreadAlertsCount();
        if (mounted) {
          setAlertCount(count);
        }
      }

      loadFocusedAlertCount();

      return () => {
        mounted = false;
      };
    }, [])
  );

  useEffect(() => {
    const intervalId = setInterval(loadAlertCount, 5000);

    return () => clearInterval(intervalId);
  }, [loadAlertCount]);

  return (
    <View
      className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700"
      style={{ backgroundColor }}
    >
      {!isSettings && (
        <TouchableOpacity onPress={onMenuPress} className="p-2">
          <AntDesign
            name="menu"
            size={24}
            className="text-black dark:text-white"
          />
        </TouchableOpacity>
      )}

      {(isHome || isDashboard || isMenu || isSales || isReports || isInventory) && (
        <Text
          className="text-lg font-bold flex-1 text-center"
          style={{ color: textColor }}
        >
          {isMenu
            ? "Menu"
            : isSales
              ? "Ventas"
              : isReports
                ? "Reportes"
                : isInventory
                  ? "Inventario"
              : username
                ? `Bienvenido(a), ${username}`
                : "Inicio"}
        </Text>
      )}
      {isSettings && (
        <View className="flex-row items-center justify-start flex-1">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            className="flex-row items-center gap-4"
            id="back-button"
          >
            <Ionicons
              name="arrow-back-outline"
              size={20}
              className="text-black dark:text-white"
            />
            <Text
              className="text-lg font-bold text-center"
              style={{ color: textColor }}
            >
              Regresar
            </Text>
          </Pressable>
        </View>
      )}
      {!isSettings ? (
        <Pressable
          onPress={() => router.push("/view/dashboard/alerts" as any)}
          className="relative p-2"
        >
          <MaterialIcons
            name="notifications-none"
            size={26}
            className="text-black dark:text-white"
          />
          {alertCount > 0 ? (
            <View className="absolute right-1 top-1 h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1">
              <Text className="text-xs font-black text-white">{alertCount}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : (
        <View className="w-8" />
      )}
    </View>
  );
}
