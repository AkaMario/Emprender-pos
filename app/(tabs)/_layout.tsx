import { Tabs } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';

import { HapticTab } from "@/components/haptic-tab";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors[colorScheme ?? "light"].background }}>
      <Navbar
        onMenuPress={() => setSidebarOpen(!sidebarOpen)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: { display: "none" }, // Oculta la tab bar
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons size={28} name="settings" color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
