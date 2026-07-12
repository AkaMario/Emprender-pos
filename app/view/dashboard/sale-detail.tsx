import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { getUserByCredentials } from "@/database/auth-database";
import {
  cancelSale,
  formatCurrency,
  formatSaleTime,
  getSaleDetail,
  type SaleDetail,
} from "@/database/pos-database";

export default function SaleDetailScreen() {
  const router = useRouter();
  const { username } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const saleId = Number(id);
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadSale = useCallback(async () => {
    if (!saleId) {
      return;
    }

    setSale(await getSaleDetail(saleId));
  }, [saleId]);

  useFocusEffect(
    useCallback(() => {
      loadSale();
    }, [loadSale])
  );

  async function handleCancelSale() {
    if (!sale || sale.status === "Cancelada") {
      return;
    }

    if (!username || !adminPassword.trim() || !cancelReason.trim()) {
      Alert.alert("Datos requeridos", "Ingresa contrasena de administrador y motivo.");
      return;
    }

    setCancelling(true);
    try {
      const admin = await getUserByCredentials(username, adminPassword);
      if (!admin) {
        throw new Error("Contrasena de administrador incorrecta.");
      }

      await cancelSale(sale.id, cancelReason);
      Alert.alert("Venta cancelada", "El inventario fue restaurado y la venta quedo cancelada.");
      setAdminPassword("");
      setCancelReason("");
      await loadSale();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo cancelar.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black">
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="rounded-full p-2 active:bg-slate-200">
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text className="text-xl font-black text-slate-950 dark:text-white">Detalle de venta</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        {!sale ? (
          <Text className="text-center text-sm font-semibold text-slate-500">Venta no encontrada.</Text>
        ) : (
          <>
            <View className="rounded-3xl bg-white p-5 dark:bg-slate-900">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  {sale.saleNumber}
                </Text>
                <View className={`rounded-full px-3 py-1 ${sale.status === "Completada" ? "bg-emerald-100" : "bg-red-100"}`}>
                  <Text className={`text-xs font-black ${sale.status === "Completada" ? "text-emerald-700" : "text-red-700"}`}>
                    {sale.status}
                  </Text>
                </View>
              </View>
              <Text className="mt-4 text-3xl font-black text-slate-950 dark:text-white">
                {formatCurrency(sale.total)}
              </Text>
              <Text className="mt-2 text-base font-semibold text-slate-500">
                {sale.orderType} · {formatSaleTime(sale.createdAt)}
              </Text>
              {sale.tableNumber ? <Text className="mt-1 text-sm font-semibold text-slate-500">Mesa {sale.tableNumber}</Text> : null}
              {sale.customerName ? <Text className="mt-1 text-sm font-semibold text-slate-500">Cliente: {sale.customerName}</Text> : null}
            </View>

            <View className="gap-3">
              <Text className="text-xl font-black text-slate-950 dark:text-white">Items</Text>
              {sale.items.map((item) => (
                <View key={item.id} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-black text-slate-950 dark:text-white">{item.dishName}</Text>
                      <Text className="text-sm font-semibold text-slate-500">x{item.quantity} · {formatCurrency(item.unitPrice)}</Text>
                    </View>
                    <Text className="font-black text-slate-950 dark:text-white">{formatCurrency(item.total)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="rounded-3xl bg-white p-5 dark:bg-slate-900">
              <Row label="Subtotal" value={formatCurrency(sale.subtotal)} />
              <Row label="Domicilio" value={formatCurrency(sale.deliveryFee)} />
              <Row label="Pago" value={sale.paymentMethod ?? "-"} />
              {sale.transferReference ? <Row label="Referencia" value={sale.transferReference} /> : null}
              {sale.amountReceived ? <Row label="Recibido" value={formatCurrency(sale.amountReceived)} /> : null}
              {sale.changeAmount ? <Row label="Cambio" value={formatCurrency(sale.changeAmount)} /> : null}
            </View>

            {sale.status === "Completada" ? (
              <View className="gap-3 rounded-3xl bg-white p-5 dark:bg-slate-900">
                <Text className="text-lg font-black text-slate-950 dark:text-white">Cancelar venta</Text>
                <TextInput
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  secureTextEntry
                  placeholder="Contrasena administrador"
                  placeholderTextColor="#94a3b8"
                  className="rounded-2xl bg-slate-100 px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-800 dark:text-white"
                />
                <TextInput
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder="Motivo obligatorio"
                  placeholderTextColor="#94a3b8"
                  className="rounded-2xl bg-slate-100 px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-800 dark:text-white"
                />
                <Pressable disabled={cancelling} onPress={handleCancelSale} className="rounded-2xl bg-red-600 px-5 py-4">
                  <Text className="text-center font-black text-white">{cancelling ? "Cancelando..." : "Cancelar venta"}</Text>
                </Pressable>
              </View>
            ) : sale.cancellationReason ? (
              <View className="rounded-2xl bg-red-50 p-4">
                <Text className="font-black text-red-700">Motivo: {sale.cancellationReason}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="font-bold text-slate-500">{label}</Text>
      <Text className="font-black text-slate-950 dark:text-white">{value}</Text>
    </View>
  );
}
