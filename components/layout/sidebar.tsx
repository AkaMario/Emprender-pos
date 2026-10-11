import { useTutorial } from "@/context/tutorial";
import { ActionPressable as Pressable } from '@/components/ui/action-pressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, usePathname } from "expo-router";
import React, { useRef } from "react";
import { Text, View, Modal, ScrollView, Platform } from "react-native";
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
  icon: React.ComponentProps<typeof Ionicons>["name"];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { profile, definition } = useBusiness();
  const { start } = useTutorial();
  const replayAfterDismiss = useRef(false);
  const router = useRouter();
  const c = useDesignColors();
  const pathname = usePathname();
  const backgroundColor = c.surface;
  const textColor = c.text;

  const sidebarItems: SidebarItem[] = [
    { label: "Inicio", route: "/(tabs)/", icon: "home-outline" },
    { label: definition?.catalog ?? "Catálogo", route: "/(tabs)/menu", icon: "grid-outline" },
    { label: "Ventas", route: "/(tabs)/sales", icon: "receipt-outline" },
    ...(profile?.model === "services" ? [] : [{ label: definition?.inventory ?? "Inventario", route: "/(tabs)/inventory", icon: "cube-outline" as const }]),
    { label: definition?.operations ?? "Operaciones", route: "/(tabs)/operations", icon: profile?.model === "rental" || profile?.model === "services" ? "calendar-outline" : "clipboard-outline" },
    { label: "Reportes", route: "/(tabs)/reports", icon: "bar-chart-outline" },
    { label: "Configuración", route: "/(tabs)/settings", icon: "settings-outline" },
  ];

  const handleNavigate = (route: string) => {
    router.navigate(route as any);
    onClose?.();
  };

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose} onDismiss={() => {
      if (replayAfterDismiss.current) {
        replayAfterDismiss.current = false;
        router.navigate('/(tabs)/settings');
        start();
      }
    }}>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={{ backgroundColor: c.scrim, opacity: 0.6, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        <SafeAreaView accessibilityViewIsModal onAccessibilityEscape={onClose} style={{ width: '85%', maxWidth: 360, flex: 1, backgroundColor }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: c.separator }}>
            <Text accessibilityRole="header" style={{ flex: 1, fontSize: 22, fontWeight: '700', color: textColor }}>{profile?.name ?? 'Mi emprendimiento'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={24} color={textColor} /></Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 8 }}>
            {sidebarItems.map((item) => {
              const selected = pathname === item.route.replace('/(tabs)', '').replace(/\/$/, '') || (item.label === 'Inicio' && pathname === '/');
              return <Pressable key={item.route} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => handleNavigate(item.route)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, padding: 16, borderRadius: 0, backgroundColor: selected ? c.primaryContainer : c.surface }}>
                <Ionicons name={item.icon} size={22} color={selected ? c.text : c.icon} accessible={false} importantForAccessibility="no" />
                <Text style={{ flex: 1, fontSize: 16, fontWeight: selected ? '700' : '500', color: textColor }}>{item.label}</Text>
              </Pressable>;
            })}
          </ScrollView>
          <View style={{ padding: 12, borderTopWidth: 1, borderColor: c.separator }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Tutorial de configuración" onPress={() => {
              // iOS must finish dismissing the sidebar before presenting the guide.
              replayAfterDismiss.current = Platform.OS === 'ios';
              onClose?.();
              if (!replayAfterDismiss.current) {
                router.navigate('/(tabs)/settings');
                start();
              }
            }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, padding: 16}}>
              <Ionicons name="help-circle-outline" size={22} color={c.muted} accessible={false} />
              <Text style={{ color: c.muted, fontSize: 16, fontWeight: '500' }}>Tutorial</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
