import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
    label: "Nueva Venta",
    route: "/(tabs)/sales",
    icon: "point-of-sale",
    color: "#ef4444",
  },
  {
    label: "Entrada de Insumos",
    route: "/view/dashboard/supply-entry",
    icon: "inventory",
    color: "#f97316",
  },
  {
    label: "Salida de Stock",
    route: "/view/dashboard/stock-out",
    icon: "remove-shopping-cart",
    color: "#0f766e",
  },
  {
    label: "Nuevo Plato",
    route: "/view/menu/create",
    icon: "restaurant-menu",
    color: "#7c3aed",
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

      loadDashboard();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const dashboardKpis = [
    {
      label: "Ventas Hoy",
      value: formatCurrency(kpis.todaySales),
      comparison: `${kpis.salesComparison >= 0 ? "+" : ""}${kpis.salesComparison}% que ayer`,
      icon: "attach-money",
      color: "#16a34a",
      background: "#dcfce7",
    },
    {
      label: "Numero de Ordenes",
      value: String(kpis.todayOrders),
      comparison: `${kpis.ordersComparison >= 0 ? "+" : ""}${kpis.ordersComparison}% que ayer`,
      icon: "receipt-long",
      color: "#2563eb",
      background: "#dbeafe",
    },
    {
      label: "Ticket Promedio",
      value: formatCurrency(kpis.averageTicket),
      comparison: `${kpis.averageComparison >= 0 ? "+" : ""}${kpis.averageComparison}% que ayer`,
      icon: "trending-up",
      color: "#9333ea",
      background: "#f3e8ff",
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-black"
      contentContainerClassName="px-4 py-5 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-5">

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-black text-slate-950 dark:text-white">
            Accesos rapidos
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route as any)}
              className="min-h-28 flex-1 basis-[45%] rounded-2xl bg-white p-4 shadow-sm active:opacity-80 dark:bg-slate-900"
            >
              <View
                className="mb-3 h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <MaterialIcons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
              </View>
              <Text className="text-base font-black text-slate-950 dark:text-white">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-5">

        <View className="gap-3">
          {dashboardKpis.map((kpi) => (
            <View
              key={kpi.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {kpi.label}
                  </Text>
                  <Text className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                    {kpi.value}
                  </Text>
                  <Text className="mt-2 text-sm font-bold text-emerald-600">
                    {kpi.comparison}
                  </Text>
                </View>
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: kpi.background }}
                >
                  <MaterialIcons
                    name={kpi.icon as any}
                    size={26}
                    color={kpi.color}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-black text-slate-950 dark:text-white">
              Ultimas ventas
            </Text>
            {/* <Text className="text-sm font-semibold text-slate-500">
              Tiempo real
            </Text> */}
          </View>

          <View className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900">
            {recentSales.map((sale, index) => (
              <Pressable
                key={sale.id}
                onPress={() =>
                  router.push({
                    pathname: "/view/dashboard/sale-detail",
                    params: { id: String(sale.id) },
                  } as any)
                }
                className={`flex-row items-center gap-3 p-4 active:bg-slate-100 dark:active:bg-slate-800 ${
                  index < recentSales.length - 1
                    ? "border-b border-slate-100 dark:border-slate-800"
                    : ""
                }`}
              >
                <View className="h-3 w-3 rounded-full bg-emerald-500" />
                <View className="flex-1">
                  <Text className="text-base font-black text-slate-950 dark:text-white">
                    {sale.dishName}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={14}
                      color="#16a34a"
                    />
                    <Text className="text-sm font-semibold text-slate-500">
                      {sale.orderType} · {formatSaleTime(sale.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text className="text-base font-black text-slate-950 dark:text-white">
                  {formatCurrency(sale.total)}
                </Text>
              </Pressable>
            ))}
            {recentSales.length === 0 ? (
              <Text className="p-4 text-center text-sm font-semibold text-slate-500">
                Aun no hay ventas registradas.
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      </View>
    </ScrollView>
  );
}
