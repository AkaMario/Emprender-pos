import { Button } from "@/components/ui/button";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDesignColors } from "@/constants/design";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { LoadFeedback, useLoadFeedback } from "@/components/ui/load-feedback";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import DateTimePicker, { type DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useCallback, useState } from "react";
import { Platform, Text, View } from "react-native";
import {
  formatCurrency,
  formatSaleTime,
  getReportsData,
  getSalesExportRowsForRange,
  type ReportPeriod,
  type ReportsData,
} from "@/database/pos-database";

import { CategoryBreakdown, HourlyOrdersChart, MetricCard, ReportCard, TopProductsList, WeeklySalesChart } from "./report-charts";

const periods: ReportPeriod[] = ["Dia", "Semana", "Mes", "Personalizado"];

function toDateText(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function getSunday(date: Date) {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return sunday;
}

function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("es-CO", opts)} - ${end.toLocaleDateString("es-CO", opts)}`;
}

function periodRangeText(period: ReportPeriod, date: Date, customStart?: string, customEnd?: string) {
  if (period === "Dia") {
    return date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  if (period === "Semana") {
    return `Semana del ${formatDateRange(getMonday(date), getSunday(date))}`;
  }
  if (period === "Mes") {
    const start = new Date(date);
    start.setDate(start.getDate() - 29);
    return formatDateRange(start, date);
  }
  if (customStart && customEnd) {
    return `${customStart} al ${customEnd}`;
  }
  return date.toLocaleDateString("es-CO");
}

export function ReportsScreen() {
  const c = useDesignColors();
  const colorScheme = useColorScheme();
  const [period, setPeriod] = useState<ReportPeriod>("Dia");
  const [date, setDate] = useState(new Date());
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [compareDate, setCompareDate] = useState("");
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"date" | "compare" | "customStart" | "customEnd">("date");

  const loadReports = useCallback(async () => {
    if (period === "Personalizado" && (!customStart || !customEnd || customStart > customEnd)) {
      setReports(null);
      return;
    }
    setReports(
      await getReportsData({
        period,
        date: toDateText(date),
        compareDate: compareDate.trim() || undefined,
        topLimit: 10,
        customStart: period === "Personalizado" ? customStart || undefined : undefined,
        customEnd: period === "Personalizado" ? customEnd || undefined : undefined,
      })
    );
  }, [compareDate, date, period, customStart, customEnd]);

  const loadStatus = useLoadFeedback(loadReports);

  async function handleExport() {
    setExporting(true);
    try {
      let startTs: number;
      let endTs: number;
      let label: string;

      if (period === "Dia") {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        startTs = start.getTime();
        endTs = end.getTime();
        label = toDateText(date);
      } else if (period === "Semana") {
        const start = getMonday(date);
        start.setHours(0, 0, 0, 0);
        const end = getSunday(date);
        end.setHours(23, 59, 59, 999);
        startTs = start.getTime();
        endTs = end.getTime();
        label = `${toDateText(start)}_${toDateText(end)}`;
      } else if (period === "Mes") {
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        startTs = start.getTime();
        endTs = end.getTime();
        label = toDateText(date);
      } else {
        if (!customStart || !customEnd) {
          Alert.alert("Rango requerido", "Selecciona fecha de inicio y fin para exportar.");
          return;
        }
        const start = new Date(customStart + "T00:00:00");
        const end = new Date(customEnd + "T23:59:59");
        startTs = start.getTime();
        endTs = end.getTime();
        label = `${customStart}_${customEnd}`;
      }

      const rows = await getSalesExportRowsForRange(startTs, endTs);
      const header = [
        "Venta", "Fecha", "Hora", "Tipo", "Estado", "Plato",
        "Cantidad", "Precio unitario", "Total item", "Subtotal",
        "Domicilio", "Total venta", "Metodo pago",
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
      const file = new File(Paths.cache, `reporte-ventas-${label}.csv`);

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

  function openPicker(target: "date" | "compare" | "customStart" | "customEnd") {
    setPickerTarget(target);
    setShowPicker(true);
  }

  function handlePickerChange(_event: DateTimePickerChangeEvent, selectedDate: Date) {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (pickerTarget === "date") {
      setDate(selectedDate);
    } else if (pickerTarget === "compare") {
      setCompareDate(toDateText(selectedDate));
    } else if (pickerTarget === "customStart") {
      setCustomStart(toDateText(selectedDate));
    } else {
      setCustomEnd(toDateText(selectedDate));
    }
  }

  function pickerValue() {
    if (pickerTarget === "date") return date;
    if (pickerTarget === "compare") return compareDate ? new Date(compareDate + "T12:00:00") : new Date();
    if (pickerTarget === "customStart") return customStart ? new Date(customStart + "T12:00:00") : new Date();
    return customEnd ? new Date(customEnd + "T12:00:00") : new Date();
  }

  const rangeIssue = period === "Personalizado"
    ? !customStart || !customEnd ? "Selecciona el inicio y el fin del período." : customStart > customEnd ? "La fecha de fin debe ser igual o posterior al inicio." : ""
    : "";

  return (
    <ScreenScroll
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <ReportCard title="Período del reporte">
        <View accessibilityLabel="Período del reporte" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {periods.map((item) => <View key={item} style={{ flexGrow: 1, flexBasis: '45%', minWidth: 104 }}>
            <Button title={item === 'Dia' ? 'Día' : item === 'Mes' ? '30 días' : item}
              variant={period === item ? 'primary' : 'secondary'} selected={period === item}
              onPress={() => { setPeriod(item); setShowPicker(false); }} />
          </View>)}
        </View>
        {period === "Personalizado" ? (
          <View style={{ gap: 8 }}>
            <DateControl label="Desde" value={customStart || "Seleccionar fecha"} onPress={() => openPicker("customStart")} />
            <DateControl label="Hasta" value={customEnd || "Seleccionar fecha"} onPress={() => openPicker("customEnd")} />
          </View>
        ) : <DateControl label={period === 'Dia' ? 'Fecha' : period === 'Semana' ? 'Semana de la fecha seleccionada' : 'Últimos 30 días hasta la fecha seleccionada'} value={periodRangeText(period, date)} onPress={() => openPicker("date")} />}
        {rangeIssue ? <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, lineHeight: 21, color: c.muted }}>{rangeIssue}</Text> : null}
        {showPicker && pickerTarget !== "compare" && <DateTimePicker value={pickerValue()} mode="date" themeVariant={colorScheme} accentColor={c.primary} textColor={c.text}
          display={Platform.OS === "ios" ? "inline" : "default"} onValueChange={handlePickerChange} onDismiss={() => setShowPicker(false)} />}
        {Platform.OS === "ios" && showPicker && pickerTarget !== "compare" && <Button title="Cerrar calendario" secondary onPress={() => setShowPicker(false)} />}
      </ReportCard>

      <LoadFeedback {...loadStatus} />
      {!loadStatus.loading && !loadStatus.error && !rangeIssue && reports && <>
        <View style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '600', color: c.text }}>Resumen del período</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <MetricCard label="Ventas" value={formatCurrency(reports.totalSales)} />
            <MetricCard label="Órdenes" value={String(reports.totalOrders)} />
          </View>
          <Button title="Exportar para Excel" variant="secondary" loading={exporting} onPress={handleExport}
            icon={(color) => <MaterialIcons name="file-download" size={20} color={color} />} />
        </View>

        <ReportCard title="Ventas por categoría" description="Distribución de las ventas del período seleccionado.">
          <CategoryBreakdown data={reports.categorySales} />
        </ReportCard>
        <ReportCard title="Productos más vendidos" description="Ordenados por unidades vendidas en el período.">
          <TopProductsList data={reports.topProducts} />
        </ReportCard>
        <ReportCard title="Ventas de la semana" description={`Del ${formatDateRange(getMonday(date), getSunday(date))}. Referencia semanal de la fecha consultada.`}>
          <WeeklySalesChart data={reports.salesByDay} />
        </ReportCard>
        <ReportCard title="Órdenes por hora" description={`${date.toLocaleDateString('es-CO')} · Horario de 13:00 a 23:00. Se muestran las horas con actividad.`}>
          <DateControl label="Comparar con otro día" value={compareDate || "Seleccionar fecha (opcional)"} onPress={() => openPicker("compare")} />
          {showPicker && pickerTarget === "compare" && <DateTimePicker value={pickerValue()} mode="date" themeVariant={colorScheme} accentColor={c.primary} textColor={c.text}
            display={Platform.OS === "ios" ? "inline" : "default"} onValueChange={handlePickerChange} onDismiss={() => setShowPicker(false)} />}
          {Platform.OS === "ios" && showPicker && pickerTarget === "compare" && <Button title="Cerrar calendario" secondary onPress={() => setShowPicker(false)} />}
          {compareDate ? <Button title="Quitar comparación" variant="ghost" onPress={() => setCompareDate("")} /> : null}
          <HourlyOrdersChart data={reports.hourlySales} compareData={reports.compareHourlySales} />
        </ReportCard>
      </>}
    </ScreenScroll>
  );
}

function DateControl({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const c = useDesignColors();
  return <Pressable accessibilityLabel={`${label}: ${value}`} accessibilityHint="Abre el calendario para cambiar la fecha" onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, padding: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
    <MaterialIcons name="calendar-today" size={20} color={c.icon} accessible={false} />
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
      <Text style={{ fontSize: 12, color: c.muted }}>{label}</Text>
      <Text style={{ fontSize: 15, lineHeight: 22, fontWeight: '600', color: c.text }}>{value}</Text>
    </View>
    <MaterialIcons name="expand-more" size={20} color={c.icon} accessible={false} />
  </Pressable>;
}
