import { useDesignColors } from "@/constants/design";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { LoadFeedback, useLoadFeedback } from "@/components/ui/load-feedback";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatSaleTime,
  getAlerts,
  markAlertAsReordering,
  markAlertAsRead,
  type AlertItem,
} from "@/database/pos-database";

export default function DashboardAlerts() {
  const c = useDesignColors();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const loadAlerts = useCallback(async () => {
    setAlerts(await getAlerts());
  }, []);

  const loadStatus = useLoadFeedback(loadAlerts);

  async function handleRead(id: number) {
    try { await markAlertAsRead(id); await loadAlerts(); }
    catch (cause) { Alert.alert("No se pudo actualizar", cause instanceof Error ? cause.message : "Intenta nuevamente."); }
  }

  async function handleReorder(id: number) {
    try { await markAlertAsReordering(id); await loadAlerts(); }
    catch (cause) { Alert.alert("No se pudo actualizar", cause instanceof Error ? cause.message : "Intenta nuevamente."); }
  }

  function alertColor(type: string) {
    if (type === "Stock critico") {
      return c.error;
    }
    if (type === "Stock bajo") {
      return c.warning;
    }

    return c.icon;
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-background ">


      <ScreenScroll contentContainerClassName="gap-3 p-4"><LoadFeedback {...loadStatus} />
        {alerts.length === 0 ? (
          <Text className="py-8 text-center text-sm font-semibold text-muted">
            No hay alertas pendientes.
          </Text>
        ) : null}
        {alerts.map((alert) => {
          const color = alertColor(alert.type);

          return (
            <View key={alert.id} className="rounded-2xl bg-surface p-4 ">
              <View className="flex-row items-start gap-3">
                <View className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <View className="flex-1">
                  <Text className="text-base font-black text-text ">
                    {alert.type}{alert.isRead ? " · Leída" : ""}
                  </Text>
                  <Text className="mt-1 text-sm font-semibold text-muted ">
                    {alert.entityName}
                  </Text>
                  <Text className="mt-1 text-xs font-semibold text-muted">
                    {alert.message} · {formatSaleTime(alert.createdAt)}
                  </Text>
                </View>
                {!alert.isRead ? (
                  <View className="gap-2">
                    {alert.type.includes("Stock") ? (
                      <Pressable onPress={() => handleReorder(alert.id)} className="rounded-full bg-primaryContainer px-3 py-2 active:bg-surfaceElevated">
                        <Text className="text-xs font-black text-link">
                          {alert.status === "En proceso" ? "En proceso" : "Reordenar"}
                        </Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => handleRead(alert.id)} className="rounded-full bg-surfaceElevated px-3 py-2 active:bg-surfaceElevated ">
                      <Text className="text-xs font-black text-text ">
                        Leida
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScreenScroll>
    </SafeAreaView>
  );
}
