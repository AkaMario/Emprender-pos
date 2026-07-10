import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useState } from "react";
import { View } from "react-native";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { SafeAreaView } from "react-native-safe-area-context";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title = "App" }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark
    ? Colors.dark.background
    : Colors.light.background;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor }}>
    <View className="flex-1" style={{ backgroundColor }}>
      <Navbar title={title} onMenuPress={() => setSidebarOpen(!sidebarOpen)} />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <View className="flex-1">{children}</View>
      </View>
    </SafeAreaView>
  );
}
