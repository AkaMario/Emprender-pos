import { Button } from "@/components/ui/button";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import {
  formatCurrency,
  formatSaleTime,
  getDashboardKpis,
  getRecentSales,
  type DashboardKpis,
  type SaleSummary,
} from "@/database/pos-database";

const quickActions = [
  {
    label: "Nueva venta",
    route: "/(tabs)/sales",
  },
  {
    label: "Entrada de insumos",
    route: "/view/dashboard/supply-entry",
  },
  {
    label: "Salida de stock",
    route: "/view/dashboard/stock-out",
  },
  {
    label: "Nuevo plato",
    route: "/view/menu/create",
  },
];

export function HomeDashboard() {
  const router = useRouter();
  const [kpis, setKpis] = useState<DashboardKpis>({
    todaySales: 0,
    todayOrders: 0,
    averageTicket: 0,
    salesComparison: 0,
    ordersComparison: 0,
    averageComparison: 0,
  });
  const [recentSales, setRecentSales] = useState<SaleSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadDashboard() {
        const [nextKpis, nextSales] = await Promise.all([getDashboardKpis(), getRecentSales(5)]);

        if (!mounted) {
          return;
        }

        setKpis(nextKpis);
        setRecentSales(nextSales);
      }

      void loadDashboard().catch((cause) => { if (mounted) Alert.alert("No se pudo cargar el resumen", cause instanceof Error ? cause.message : "Intenta nuevamente."); });

      return () => {
        mounted = false;
      };
    }, [])
  );

  const dashboardKpis = [
    {
      label: "Ventas de hoy",
      value: formatCurrency(kpis.todaySales),
      comparison: `${kpis.salesComparison >= 0 ? "+" : ""}${kpis.salesComparison}% que ayer`,
    },
    {
      label: "Número de órdenes",
      value: String(kpis.todayOrders),
      comparison: `${kpis.ordersComparison >= 0 ? "+" : ""}${kpis.ordersComparison}% que ayer`,
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(kpis.averageTicket),
      comparison: `${kpis.averageComparison >= 0 ? "+" : ""}${kpis.averageComparison}% que ayer`,
    },
  ];

  return (
    <ScreenScroll
      className="flex-1 bg-background "
      contentContainerClassName="px-4 py-5 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-5">

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-semibold text-text ">
            Accesos rápidos
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {quickActions.map((action, index) => (
            <View key={action.label}>
              <Button title={action.label} variant={index === 0 ? "primary" : "secondary"} onPress={() => router.push(action.route as any)} />
            </View>
          ))}
        </View>
      </View>

      <View className="gap-5">

        <View className="gap-3">
          {dashboardKpis.map((kpi) => (
            <View
              key={kpi.label}
              className="rounded-none border border-separator bg-surface p-4  "
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-muted ">
                    {kpi.label}
                  </Text>
                  <Text className="mt-2 text-3xl font-semibold text-text ">
                    {kpi.value}
                  </Text>
                  <Text className="mt-2 text-sm font-medium text-muted">
                    {kpi.comparison}
                  </Text>
                </View>

              </View>
            </View>
          ))}
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-text ">
              Últimas ventas
            </Text>
          </View>

          <View className="overflow-hidden rounded-none bg-surface ">
            {recentSales.map((sale, index) => (
              <Pressable
                key={sale.id}
                onPress={() =>
                  router.push({
                    pathname: "/view/dashboard/sale-detail",
                    params: { id: String(sale.id) },
                  } as any)
                }
                className={`flex-row items-center gap-3 p-4 active:bg-surfaceElevated ${
                  index < recentSales.length - 1
                    ? "border-b border-separator "
                    : ""
                }`}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-text ">
                    {sale.dishName}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <Text className="text-sm font-semibold text-muted">
                      {sale.orderType} · {formatSaleTime(sale.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text className="text-base font-semibold text-text ">
                  {formatCurrency(sale.total)}
                </Text>
              </Pressable>
            ))}
            {recentSales.length === 0 ? (
              <Text className="p-4 text-center text-sm font-semibold text-muted">
                Aún no hay ventas registradas.
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      </View>
    </ScreenScroll>
  );
}
