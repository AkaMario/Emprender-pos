import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatSaleTime,
  getAlerts,
  markAlertAsRead,
  type AlertItem,
} from "@/database/pos-database";

export default function DashboardAlerts() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const loadAlerts = useCallback(async () => {
    setAlerts(await getAlerts());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  async function handleRead(id: number) {
    await markAlertAsRead(id);
    await loadAlerts();
  }

  function alertColor(type: string) {
    if (type === "Stock critico") {
      return "#dc2626";
    }
    if (type === "Stock bajo") {
      return "#f97316";
    }

    return "#64748b";
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black">
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="rounded-full p-2 active:bg-slate-200">
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <View>
          <Text className="text-xl font-black text-slate-950 dark:text-white">
            Alertas pendientes
          </Text>
          <Text className="text-sm font-semibold text-slate-500">
            Stock bajo, stock critico y ordenes canceladas
          </Text>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-3 p-4">
        {alerts.length === 0 ? (
          <Text className="py-8 text-center text-sm font-semibold text-slate-500">
            No hay alertas pendientes.
          </Text>
        ) : null}
        {alerts.map((alert) => {
          const color = alertColor(alert.type);

          return (
            <View key={alert.id} className="rounded-2xl bg-white p-4 dark:bg-slate-900" style={{ opacity: alert.isRead ? 0.55 : 1 }}>
              <View className="flex-row items-start gap-3">
                <View className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <View className="flex-1">
                  <Text className="text-base font-black text-slate-950 dark:text-white">
                    {alert.type}
                  </Text>
                  <Text className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {alert.entityName}
                  </Text>
                  <Text className="mt-1 text-xs font-semibold text-slate-400">
                    {alert.message} · {formatSaleTime(alert.createdAt)}
                  </Text>
                </View>
                {!alert.isRead ? (
                  <Pressable onPress={() => handleRead(alert.id)} className="rounded-full bg-slate-100 px-3 py-2 active:opacity-75 dark:bg-slate-800">
                    <Text className="text-xs font-black text-slate-700 dark:text-slate-200">
                      Leida
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
