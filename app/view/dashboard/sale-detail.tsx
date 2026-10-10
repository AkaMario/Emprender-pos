import { Button } from "@/components/ui/button";
import { useFormProtection } from "@/hooks/use-form-protection";
import { FieldGroup, AppInput } from "@/components/ui/form-input";
import { LoadFeedback, useLoadFeedback } from "@/components/ui/load-feedback";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { useBusiness } from "@/context/business";
import { BusinessSaleDetail } from "@/components/business/sale-detail";
import { getUserByCredentials } from "@/database/auth-database";
import {
  cancelSale,
  formatCurrency,
  formatSaleTime,
  getSaleDetail,
  type SaleDetail,
} from "@/database/pos-database";

export default function SaleDetailScreen() {
  return useBusiness().isRestaurant ? (
    <RestaurantSaleDetail />
  ) : (
    <BusinessSaleDetail />
  );
}

function RestaurantSaleDetail() {
  const { username } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const saleId = Number(id);
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const { dialog, markSaved } = useFormProtection(
    [adminPassword, cancelReason],
    cancelling,
  );

  const loadSale = useCallback(async () => {
    if (!saleId) {
      return;
    }

    setSale(await getSaleDetail(saleId));
  }, [saleId]);

  const loadStatus = useLoadFeedback(loadSale);

  async function handleCancelSale() {
    if (cancelling || !sale || sale.status === "Cancelada") {
      return;
    }

    if (!username || !adminPassword.trim() || !cancelReason.trim()) {
      Alert.alert(
        "Datos requeridos",
        "Ingresa contrasena de administrador y motivo.",
      );
      return;
    }

    Alert.alert(
      "Cancelar venta",
      "Se restaurará el inventario y la venta quedará cancelada. ¿Continuar?",
      [
        { text: "Conservar venta", style: "cancel" },
        {
          text: "Cancelar venta",
          style: "destructive",
          onPress: performCancelSale,
        },
      ],
    );
  }
  async function performCancelSale() {
    if (cancelling || !sale || !username) return;
    setCancelling(true);
    try {
      const admin = await getUserByCredentials(username, adminPassword);
      if (!admin) {
        throw new Error("Contrasena de administrador incorrecta.");
      }

      await cancelSale(sale.id, cancelReason);
      Alert.alert(
        "Venta cancelada",
        "El inventario fue restaurado y la venta quedo cancelada.",
      );
      markSaved(["", ""]);
      setAdminPassword("");
      setCancelReason("");
      await loadSale();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo cancelar.",
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-background ">
      <ScreenScroll contentContainerClassName="gap-4 p-4 pb-10">
        {dialog}
        <LoadFeedback {...loadStatus} />
        {!sale && !loadStatus.loading && !loadStatus.error ? (
          <Text className="text-center text-sm font-semibold text-muted">
            Venta no encontrada.
          </Text>
        ) : sale ? (
          <>
            <View className="rounded-none bg-surface p-5 ">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold uppercase tracking-wide text-muted">
                  {sale.saleNumber}
                </Text>
                <View
                  className={`rounded-none px-3 py-1 ${sale.status === "Completada" ? "bg-successContainer" : "bg-errorContainer"}`}
                >
                  <Text
                    className={`text-xs font-semibold ${sale.status === "Completada" ? "text-success" : "text-error"}`}
                  >
                    {sale.status}
                  </Text>
                </View>
              </View>
              <Text className="mt-4 text-3xl font-semibold text-text ">
                {formatCurrency(sale.total)}
              </Text>
              <Text className="mt-2 text-base font-semibold text-muted">
                {sale.orderType} · {formatSaleTime(sale.createdAt)}
              </Text>
              {sale.tableNumber ? (
                <Text className="mt-1 text-sm font-semibold text-muted">
                  Mesa {sale.tableNumber}
                </Text>
              ) : null}
              {sale.customerName ? (
                <Text className="mt-1 text-sm font-semibold text-muted">
                  Cliente: {sale.customerName}
                </Text>
              ) : null}
            </View>

            <View className="gap-3">
              <Text className="text-xl font-semibold text-text ">Items</Text>
              {sale.items.map((item) => (
                <View key={item.id} className="rounded-none bg-surface p-4 ">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-semibold text-text ">
                        {item.dishName}
                      </Text>
                      <Text className="text-sm font-semibold text-muted">
                        x{item.quantity} · {formatCurrency(item.unitPrice)}
                      </Text>
                    </View>
                    <Text className="font-semibold text-text ">
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="rounded-none bg-surface p-5 ">
              <Row label="Subtotal" value={formatCurrency(sale.subtotal)} />
              <Row label="Domicilio" value={formatCurrency(sale.deliveryFee)} />
              <Row label="Pago" value={sale.paymentMethod ?? "-"} />
              {sale.transferReference ? (
                <Row label="Referencia" value={sale.transferReference} />
              ) : null}
              {sale.amountReceived ? (
                <Row
                  label="Recibido"
                  value={formatCurrency(sale.amountReceived)}
                />
              ) : null}
              {sale.changeAmount ? (
                <Row label="Cambio" value={formatCurrency(sale.changeAmount)} />
              ) : null}
            </View>

            {sale.status === "Completada" ? (
              <View className="gap-3 rounded-none bg-surface p-5 ">
                <Text className="text-lg font-semibold text-text ">
                  Cancelar venta
                </Text>
                <FieldGroup label="Contraseña del administrador *">
                  <AppInput
                    editable={!cancelling}
                    value={adminPassword}
                    onChangeText={setAdminPassword}
                    secureTextEntry
                    placeholder="Contrasena administrador"
                    className="rounded-none bg-surfaceElevated px-4 py-4 text-base font-semibold text-text "
                  />
                </FieldGroup>
                <FieldGroup label="Motivo de cancelación *">
                  <AppInput
                    editable={!cancelling}
                    value={cancelReason}
                    onChangeText={setCancelReason}
                    placeholder="Motivo obligatorio"
                    className="rounded-none bg-surfaceElevated px-4 py-4 text-base font-semibold text-text "
                  />
                </FieldGroup>
                <Button
                  title="Cancelar venta"
                  variant="destructive"
                  loading={cancelling}
                  onPress={handleCancelSale}
                />
              </View>
            ) : sale.cancellationReason ? (
              <View className="rounded-none bg-errorContainer p-4">
                <Text className="font-semibold text-error">
                  Motivo: {sale.cancellationReason}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </ScreenScroll>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="font-bold text-muted">{label}</Text>
      <Text className="font-semibold text-text ">{value}</Text>
    </View>
  );
}
