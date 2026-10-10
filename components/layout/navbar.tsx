import { useAuth } from '@/context/auth';
import { useBusiness } from '@/context/business';
import { useDesignColors } from '@/constants/design';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { ActionPressable as Pressable } from '@/components/ui/action-pressable';
import { getUnreadAlertsCount } from '@/database/pos-database';

export function Navbar({ title, onMenuPress }: { title?: string; onMenuPress?: () => void }) {
  const { definition, isRestaurant } = useBusiness(); const { username } = useAuth();
  const c = useDesignColors(); const pathname = usePathname(); const router = useRouter();
  const secondary = pathname.startsWith('/view/'); const [alertCount, setAlertCount] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    const refresh = async () => {
      try { const count = isRestaurant ? await getUnreadAlertsCount() : 0; if (active) setAlertCount(count); }
      catch { /* Keep the previous count if a transient database read fails. */ }
    };
    void refresh();
    const timer = isRestaurant ? setInterval(() => { void refresh(); }, 5000) : undefined;
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [isRestaurant]));
  const titles: Record<string, string | undefined> = { menu: definition?.catalog, sales: 'Ventas', reports: 'Reportes', inventory: definition?.inventory, settings: 'Configuración', operations: definition?.operations, dashboard: 'Resumen' };
  const currentTitle = title ?? titles[pathname.split('/').pop() ?? ''] ?? (username ? `Hola, ${username}` : 'Inicio');
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: c.surface, borderBottomWidth: 1, borderColor: c.separator }}>
    <Pressable accessibilityRole="button" accessibilityLabel={secondary ? 'Regresar' : 'Abrir menú de navegación'} onPress={secondary ? () => router.canGoBack() ? router.back() : router.replace('/') : onMenuPress} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={secondary ? 'arrow-back' : 'menu'} size={24} color={c.text} /></Pressable>
    <Text accessibilityRole="header" style={{ flex: 1, fontSize: 20, fontWeight: '700', color: c.text }}>{currentTitle}</Text>
    {isRestaurant && !secondary && <Pressable accessibilityRole="button" accessibilityLabel={`Notificaciones${alertCount ? `, ${alertCount} sin leer` : ''}`} onPress={() => router.push('/view/dashboard/alerts')} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="notifications-outline" size={24} color={c.text} />{alertCount > 0 && <View style={{ position: 'absolute', right: 0, top: 0, borderRadius: 0, backgroundColor: c.error, paddingHorizontal: 5 }}><Text style={{ color: c.onError, fontSize: 12 }}>{alertCount > 99 ? '99+' : alertCount}</Text></View>}</Pressable>}
  </View>;
}
