import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";

interface NavbarProps {
  title?: string;
  onMenuPress?: () => void;
}

export function Navbar({ title = "Bienvenido", onMenuPress }: NavbarProps) {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/" || pathname.includes("index");
  const isSettings = pathname.includes("settings");
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark
    ? Colors.dark.background
    : Colors.light.background;
  const textColor = isDark ? "#fff" : "#000";

  const { username } = useAuth();

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

      {isHome && (
        <Text
          className="text-lg font-bold flex-1 text-center"
          style={{ color: textColor }}
        >
          {username ? (
            <Text className="mt-2 text-gray-800">
              Bienvenido(a), {username}
            </Text>
          ) : null}
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
      <View className="w-8" />
    </View>
  );
}
