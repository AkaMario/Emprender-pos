import { ActionPressable as Pressable } from '@/components/ui/action-pressable';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, usePathname } from "expo-router";
import React from "react";
import { Text, View, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDesignColors } from "@/constants/design";
import { useBusiness } from "@/context/business";

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
  const { profile, definition } = useBusiness();
  const router = useRouter();
  const c = useDesignColors();
  const pathname = usePathname();
  const backgroundColor = c.surface;
  const textColor = c.text;

  const sidebarItems: SidebarItem[] = [
    { label: "Inicio", route: "/(tabs)/", icon: "home" },
    { label: definition?.catalog ?? "Catálogo", route: "/(tabs)/menu", icon: definition?.icon ?? "storefront" },
    { label: "Ventas", route: "/(tabs)/sales", icon: "point-of-sale" },
    ...(profile?.model === "services" ? [] : [{ label: definition?.inventory ?? "Inventario", route: "/(tabs)/inventory", icon: "inventory-2" }]),
    { label: definition?.operations ?? "Operaciones", route: "/(tabs)/operations", icon: profile?.model === "rental" || profile?.model === "services" ? "event" : "assignment" },
    { label: "Reportes", route: "/(tabs)/reports", icon: "bar-chart" },
    { label: "Configuración", route: "/(tabs)/settings", icon: "settings" },
  ];

  const handleNavigate = (route: string) => {
    router.navigate(route as any);
    onClose?.();
  };

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={{ backgroundColor: c.scrim, opacity: 0.6, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        <SafeAreaView accessibilityViewIsModal onAccessibilityEscape={onClose} style={{ width: '85%', maxWidth: 360, flex: 1, backgroundColor }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: c.border }}>
            <Text accessibilityRole="header" style={{ flex: 1, fontSize: 22, fontWeight: '700', color: textColor }}>{profile?.name ?? 'Mi emprendimiento'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="close" size={24} color={textColor} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
            {sidebarItems.map((item) => {
              const selected = pathname === item.route.replace('/(tabs)', '').replace(/\/$/, '') || (item.label === 'Inicio' && pathname === '/');
              return <Pressable key={item.route} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => handleNavigate(item.route)} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, padding: 16, borderRadius: 12, backgroundColor: selected ? c.primaryContainer : c.surface }}>
                <MaterialIcons name={item.icon as any} size={24} color={selected ? c.primary : textColor} /><Text style={{ flex: 1, fontSize: 16, fontWeight: '600', marginLeft: 12, color: textColor }}>{item.label}</Text>
              </Pressable>;
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
