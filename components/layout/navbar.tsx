import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePathname } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface NavbarProps {
  title?: string;
  onMenuPress?: () => void;
}

export function Navbar({ title = "Bienvenido", onMenuPress }: NavbarProps) {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname.includes("index");
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
      <TouchableOpacity onPress={onMenuPress} className="p-2">
        <Text className="text-xl font-semibold" style={{ color: textColor }}>
          ☰
        </Text>
      </TouchableOpacity>

      {isHome && (
        <Text
          className="text-lg font-bold flex-1 text-center"
          style={{ color: textColor }}
        >
          {username ? (
            <Text className="mt-2 text-gray-500">
              Bienvenido(a), {username}
            </Text>
          ) : null}
        </Text>
      )}

      <View className="w-8" />
    </View>
  );
}
