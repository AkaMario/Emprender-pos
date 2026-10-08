import { useDesignColors } from "@/constants/design";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Navbar } from "@/components/layout/navbar";
import { Redirect, Stack, usePathname } from "expo-router";
import { useBusiness } from "@/context/business";

// Guard direct links as well as menu navigation into restaurant-only flows.
export default function ViewLayout() {
  const c = useDesignColors();
  const { isRestaurant } = useBusiness();
  const path = usePathname();
  if (path.startsWith("/view/login/")) return <Redirect href="/" />;
  const restaurantOnly = /\/view\/(menu|inventory|category)\//.test(path) || /\/view\/dashboard\/(supply-entry|stock-out|new-dish|alerts)$/.test(path);
  if (!isRestaurant && restaurantOnly) return <Redirect href="/" />;
  if (isRestaurant && path.startsWith("/view/business/")) return <Redirect href="/" />;
  const titles: Record<string, string> = {
    offering: 'Artículo', 'category-view': 'Categorías', 'select-qr': 'QR de transferencias',
    'change-password': 'Cambiar contraseña', 'change-pin': 'Cambiar PIN', 'change-security-question': 'Pregunta de seguridad',
    alerts: 'Notificaciones', 'supply-entry': 'Entrada de insumos', 'stock-out': 'Salida de inventario',
    'sale-detail': 'Detalle de venta', 'new-sale': 'Nueva venta', 'new-dish': 'Nuevo plato',
    history: 'Historial de inventario', create: path.includes('/menu/') ? 'Crear plato' : 'Nuevo insumo', edit: 'Editar plato',
  };
  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: c.background }}>
    <Navbar title={titles[path.split('/').pop() ?? ''] ?? 'Detalle'} />
    <View style={{ flex: 1, backgroundColor: c.background }}><Stack screenOptions={{ headerShown: false }} /></View>
  </SafeAreaView>;
}
