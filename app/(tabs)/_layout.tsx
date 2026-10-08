import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from "@/context/auth";
import { HapticTab } from "@/components/haptic-tab";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useDesignColors } from "@/constants/design";
import { useBusiness } from "@/context/business";

export default function TabLayout() {
  const { definition } = useBusiness();
  const { isAuthenticated, isLoading } = useAuth();
  const c = useDesignColors();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1" style={{ backgroundColor: c.background }}>
      <Navbar
        onMenuPress={() => setSidebarOpen(!sidebarOpen)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarButton: HapticTab,
          tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.separator },
          tabBarLabelStyle: { fontSize: 12 },
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.icon,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore", href: null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Configuración", href: null,
            tabBarIcon: ({ color }) => (
              <Ionicons size={28} name="settings" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: definition?.catalog,
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="category" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sales"
          options={{
            title: "Ventas",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="receipt-long" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Reportes", href: null,
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="bar-chart" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: definition?.inventory, href: null,
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="inventory-2" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="operations"
          options={{ title: definition?.operations, href: null }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard", href: null,
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="dashboard" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
