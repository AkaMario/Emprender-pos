import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  formatCurrency,
  formatSaleTime,
  getReportsData,
  getSalesExportRowsForDate,
  type CategorySales,
  type HourlySales,
  type ReportPeriod,
  type ReportsData,
  type SalesByDay,
  type TopProduct,
} from "@/database/pos-database";

const periods: ReportPeriod[] = ["Dia", "Semana", "Mes", "Personalizado"];
const categoryColors = ["#f97316", "#7c3aed", "#0ea5e9", "#64748b"];

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsScreen() {
  const [period, setPeriod] = useState<ReportPeriod>("Dia");
  const [date, setDate] = useState(todayText());
  const [compareDate, setCompareDate] = useState("");
  const [selectedBar, setSelectedBar] = useState<SalesByDay | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadReports = useCallback(async () => {
    setReports(
      await getReportsData({
        period,
        date,
        compareDate: compareDate.trim() || undefined,
        topLimit: 10,
      })
    );
  }, [compareDate, date, period]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  async function exportDayCsv() {
    setExporting(true);
    try {
      const rows = await getSalesExportRowsForDate(date);
      const header = [
        "Venta",
        "Fecha",
        "Hora",
        "Tipo",
        "Estado",
        "Plato",
        "Cantidad",
        "Precio unitario",
        "Total item",
        "Subtotal",
        "Domicilio",
        "Total venta",
        "Metodo pago",
      ];
      const csvRows = rows.map((row) =>
        [
          row.sale_number,
          new Date(row.created_at).toISOString().slice(0, 10),
          formatSaleTime(row.created_at),
          row.order_type,
          row.status,
          row.dish_name,
          row.quantity,
          row.unit_price,
          row.item_total,
          row.subtotal,
          row.delivery_fee,
          row.total,
          row.payment_method ?? "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      );
      const file = new File(Paths.cache, `reporte-ventas-${date}.csv`);

      file.create({ overwrite: true });
      file.write([header.join(","), ...csvRows].join("\n"));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          dialogTitle: "Exportar reporte de ventas",
          mimeType: "text/csv",
        });
      } else {
        Alert.alert("Exportado", `Archivo generado: ${file.uri}`);
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo exportar.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-black"
      contentContainerClassName="gap-5 px-4 py-5 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        disabled={exporting}
        onPress={exportDayCsv}
        className="flex-row items-center justify-center gap-2 rounded-2xl bg-orange-700 px-5 py-4 active:opacity-85"
      >
        <MaterialIcons name="file-download" size={22} color="white" />
        <Text className="font-black text-white">
          {exporting ? "Exportando..." : "Exportar Excel"}
        </Text>
      </Pressable>
      <View className="gap-3">
        {/* <Text className="text-xl font-black text-slate-950 dark:text-white">Periodo</Text> */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {periods.map((item) => (
              <Pressable
                key={item}
                onPress={() => setPeriod(item)}
                className={`rounded-full px-4 py-3 ${period === item ? "bg-slate-950" : "bg-white dark:bg-slate-900"}`}
              >
                <Text className={`text-sm font-black ${period === item ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
          className="rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-950 dark:bg-slate-900 dark:text-white"
        />
      </View>

      <View className="flex-row gap-3">
        <MetricCard label="Ventas" value={formatCurrency(reports?.totalSales ?? 0)} />
        <MetricCard label="Ordenes" value={String(reports?.totalOrders ?? 0)} />
      </View>

      

      <ReportCard title="Ventas de la semana">
        <WeeklyBarChart
          data={reports?.salesByDay ?? []}
          selectedBar={selectedBar}
          onSelect={setSelectedBar}
        />
      </ReportCard>

      <ReportCard title="Ventas por categoria">
        <CategoryPieChart data={reports?.categorySales ?? []} />
      </ReportCard>

      <ReportCard title="Tendencia horaria">
        <TextInput
          value={compareDate}
          onChangeText={setCompareDate}
          placeholder="Comparar con YYYY-MM-DD (opcional)"
          placeholderTextColor="#94a3b8"
          className="mb-3 rounded-2xl bg-slate-100 px-4 py-3 text-base font-semibold text-slate-950 dark:bg-slate-800 dark:text-white"
        />
        <HourlyLineChart
          data={reports?.hourlySales ?? []}
          compareData={reports?.compareHourlySales ?? []}
        />
      </ReportCard>

      <ReportCard title="Top productos">
        <TopProductsList data={reports?.topProducts ?? []} />
      </ReportCard>
    </ScrollView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4 dark:bg-slate-900">
      <Text className="text-sm font-bold text-slate-500">{label}</Text>
      <Text className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</Text>
    </View>
  );
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="rounded-3xl bg-white p-4 dark:bg-slate-900">
      <Text className="mb-4 text-xl font-black text-slate-950 dark:text-white">{title}</Text>
      {children}
    </View>
  );
}

function WeeklyBarChart({
  data,
  selectedBar,
  onSelect,
}: {
  data: SalesByDay[];
  selectedBar: SalesByDay | null;
  onSelect: (bar: SalesByDay) => void;
}) {
  const maxTotal = Math.max(1, ...data.map((item) => item.total));
  const trend = data.length > 1 ? data[data.length - 1].total - data[0].total : 0;

  return (
    <View>
      <View className="h-44 flex-row items-end gap-2 border-b border-l border-slate-200 pb-2 pl-2 dark:border-slate-700">
        {data.map((item) => {
          const height = Math.max(8, Math.round((item.total / maxTotal) * 130));

          return (
            <Pressable key={item.day} onPress={() => onSelect(item)} className="flex-1 items-center justify-end">
              <Text className="mb-1 text-[10px] font-bold text-slate-500">
                {item.total > 0 ? formatCurrency(item.total) : ""}
              </Text>
              <View
                className={`w-full rounded-t-xl ${item.isToday ? "bg-orange-500" : "bg-slate-800 dark:bg-slate-200"}`}
                style={{ height }}
              />
            </Pressable>
          );
        })}
      </View>
      <View className="mt-2 flex-row gap-2 pl-2">
        {data.map((item) => (
          <Text key={item.day} className="flex-1 text-center text-xs font-black text-slate-500">
            {item.day}
          </Text>
        ))}
      </View>
      <Text className="mt-3 text-sm font-bold text-slate-500">
        Tendencia: {trend >= 0 ? "sube" : "baja"} {formatCurrency(Math.abs(trend))} de Lun a Dom
      </Text>
      {selectedBar ? (
        <Text className="mt-2 rounded-xl bg-orange-100 p-3 text-center font-black text-orange-700">
          {selectedBar.day}: {formatCurrency(selectedBar.total)}
        </Text>
      ) : null}
    </View>
  );
}

function CategoryPieChart({ data }: { data: CategorySales[] }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <View className="gap-4">
      <View className="items-center">
        <View className="h-36 w-36 items-center justify-center rounded-full border-[18px] border-orange-500 bg-white dark:bg-slate-900">
          <Text className="text-3xl font-black text-slate-950 dark:text-white">100%</Text>
          <Text className="text-xs font-bold text-slate-500">{formatCurrency(total)}</Text>
        </View>
      </View>
      <View className="h-5 flex-row overflow-hidden rounded-full bg-slate-100">
        {data.map((item, index) => (
          <View
            key={item.category}
            style={{
              width: `${item.percentage}%`,
              backgroundColor: categoryColors[index],
            }}
          />
        ))}
      </View>
      {data.map((item, index) => (
        <View key={item.category} className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColors[index] }} />
            <Text className="font-bold text-slate-600 dark:text-slate-300">{item.category}</Text>
          </View>
          <Text className="font-black text-slate-950 dark:text-white">
            {item.percentage}% · {formatCurrency(item.total)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HourlyLineChart({ data, compareData }: { data: HourlySales[]; compareData: HourlySales[] }) {
  const maxOrders = Math.max(1, ...data.map((item) => item.orders), ...compareData.map((item) => item.orders));
  const peak = data.reduce<HourlySales | null>((result, item) => {
    if (!result || item.orders > result.orders) {
      return item;
    }

    return result;
  }, null);

  return (
    <View>
      <View className="h-40 flex-row items-end gap-1 border-b border-l border-slate-200 bg-orange-50/60 pb-2 pl-2 dark:border-slate-700 dark:bg-orange-950/20">
        {data.map((item, index) => {
          const height = Math.max(6, Math.round((item.orders / maxOrders) * 120));
          const compareHeight = Math.max(0, Math.round(((compareData[index]?.orders ?? 0) / maxOrders) * 120));
          const isPeak = peak?.hour === item.hour && item.orders > 0;

          return (
            <View key={item.hour} className="flex-1 items-center justify-end">
              {isPeak ? <Text className="mb-1 text-[10px] font-black text-orange-700">{item.orders}</Text> : null}
              <View className="w-full items-center justify-end" style={{ height: 124 }}>
                {compareHeight > 0 ? <View className="absolute bottom-0 w-1 rounded-full bg-slate-400" style={{ height: compareHeight }} /> : null}
                <View className={`w-2 rounded-full ${isPeak ? "bg-orange-600" : "bg-orange-400"}`} style={{ height }} />
              </View>
            </View>
          );
        })}
      </View>
      <View className="mt-2 flex-row gap-1 pl-2">
        {data.map((item) => (
          <Text key={item.hour} className="flex-1 text-center text-[10px] font-black text-slate-500">
            {item.hour > 12 ? `${item.hour - 12}p` : `${item.hour}a`}
          </Text>
        ))}
      </View>
      <Text className="mt-3 text-sm font-bold text-slate-500">
        Punto maximo: {peak ? `${peak.hour}:00 con ${peak.orders} ordenes` : "sin datos"}
      </Text>
    </View>
  );
}

function TopProductsList({ data }: { data: TopProduct[] }) {
  const maxQuantity = Math.max(1, ...data.map((item) => item.quantity));

  if (data.length === 0) {
    return <Text className="text-center text-sm font-semibold text-slate-500">No hay productos vendidos en este periodo.</Text>;
  }

  return (
    <View className="gap-3">
      {data.map((item, index) => (
        <View key={`${item.dishName}-${index}`} className="gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-black text-slate-950 dark:text-white">
              {index + 1}. {item.dishName}
            </Text>
            <Text className="font-black text-slate-950 dark:text-white">{item.quantity} und</Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <View className="h-full rounded-full bg-orange-500" style={{ width: `${(item.quantity / maxQuantity) * 100}%` }} />
          </View>
          <Text className="text-sm font-bold text-slate-500">Ingreso: {formatCurrency(item.total)}</Text>
        </View>
      ))}
    </View>
  );
}
