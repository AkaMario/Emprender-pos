import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface SidebarItem {
  label: string;
  route: string;
  icon: string;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark ? "#1a1a1a" : "#f5f5f5";
  const textColor = isDark ? "#fff" : "#000";

  const sidebarItems: SidebarItem[] = [
    { label: "Inicio", route: "/(tabs)/", icon: "home" },
    { label: "Menu", route: "/(tabs)/menu", icon: "restaurant-menu" },
    { label: "Ventas", route: "/(tabs)/sales", icon: "point-of-sale" },
    { label: "Reportes", route: "/(tabs)/reports", icon: "bar-chart" },
    { label: "Configuracion", route: "/(tabs)/settings", icon: "settings" },
  ];

  const handleNavigate = (route: string) => {
    router.push(route as any);
    onClose?.();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <TouchableOpacity
          className="absolute inset-0 bg-black/50 z-40"
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Sidebar */}
      <SafeAreaView
        className={`absolute top-0 left-0 bottom-0 w-64 z-50 transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor }}
      >
        <View className="flex-1 pt-4 gap-4">
          <View className="px-4 pb-4 border-b border-gray-300 dark:border-gray-600 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: textColor }}>
              Menu
            </Text>
            <Pressable onPress={onClose} className="p-2">
              <MaterialIcons name="close" size={24} color="black" />
            </Pressable>
          </View>

          {sidebarItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleNavigate(item.route)}
              className="flex-row items-center px-4 py-3"
              style={{
                backgroundColor: isOpen ? "transparent" : backgroundColor,
              }}
            >
              <MaterialIcons
                name={item.icon as any}
                size={24}
                color={textColor}
              />
              <Text
                className="text-base font-medium ml-3"
                style={{ color: textColor }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* <View className="border-t border-gray-300 dark:border-gray-600 p-4">
          <Text className="text-xs" style={{ color: textColor, opacity: 0.6 }}>
            v1.0.0
          </Text>
        </View> */}
      </SafeAreaView>
    </>
  );
}
