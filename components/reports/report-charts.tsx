import React from 'react';
import { Text, View } from 'react-native';
import { useDesignColors } from '@/constants/design';
import { formatCurrency, type CategorySales, type HourlySales, type SalesByDay, type TopProduct } from '@/database/pos-database';

export function ReportCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const c = useDesignColors();
  return <View style={{ padding: 16, gap: 16, backgroundColor: c.surface, minWidth: 0 }}>
    <View style={{ gap: 4 }}>
      <Text accessibilityRole="header" style={{ fontSize: 19, lineHeight: 26, fontWeight: '600', color: c.text }}>{title}</Text>
      {description && <Text style={{ fontSize: 13, lineHeight: 19, color: c.muted }}>{description}</Text>}
    </View>
    {children}
  </View>;
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  const c = useDesignColors();
  return <View style={{ flexGrow: 1, flexBasis: '45%', minWidth: 140, padding: 16, gap: 8, backgroundColor: c.surface }}>
    <Text style={{ fontSize: 14, color: c.muted }}>{label}</Text>
    <Text style={{ fontSize: 24, lineHeight: 32, fontWeight: '600', color: c.text, flexShrink: 1, fontVariant: ['tabular-nums'] }}>{value}</Text>
  </View>;
}

function EmptyReport({ children }: { children: React.ReactNode }) {
  const c = useDesignColors();
  return <Text style={{ fontSize: 14, lineHeight: 22, color: c.muted }}>{children}</Text>;
}

// Zero stays zero; never draw a minimum-size bar that suggests nonexistent sales.
function Bar({ value, max, comparison = false }: { value: number; max: number; comparison?: boolean }) {
  const c = useDesignColors();
  const width = Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0));
  return <View accessible={false} style={{ height: 6, backgroundColor: c.surfaceElevated, overflow: 'hidden' }}>
    <View style={{ height: '100%', width: `${width}%`, backgroundColor: comparison ? c.chart4 : c.primary }} />
  </View>;
}

export function WeeklySalesChart({ data }: { data: SalesByDay[] }) {
  const c = useDesignColors();
  const max = Math.max(0, ...data.map((item) => item.total));
  if (max === 0) return <EmptyReport>No hay ventas registradas en esta semana.</EmptyReport>;
  return <View style={{ gap: 12 }}>
    {data.map((item) => <View key={item.day} accessible accessibilityLabel={`${item.day}: ${formatCurrency(item.total)}`} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 }}>
        <Text style={{ fontSize: 13, lineHeight: 19, color: c.muted }}>{item.day === 'Mie' ? 'Mié' : item.day === 'Sab' ? 'Sáb' : item.day}{item.isToday ? ' · Hoy' : ''}</Text>
        <Text style={{ fontSize: 13, lineHeight: 19, fontWeight: '600', color: c.text, fontVariant: ['tabular-nums'] }}>{formatCurrency(item.total)}</Text>
      </View>
      <Bar value={item.total} max={max} />
    </View>)}
  </View>;
}

export function CategoryBreakdown({ data }: { data: CategorySales[] }) {
  const c = useDesignColors();
  const total = data.reduce((sum, item) => sum + item.total, 0);
  if (total === 0) return <EmptyReport>No hay ventas por categoría en este período.</EmptyReport>;
  return <View style={{ gap: 16 }}>
    {data.map((item) => <View key={item.category} style={{ gap: 6 }}>
      <Text style={{ fontSize: 15, lineHeight: 22, fontWeight: '600', color: c.text }}>{item.category}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 }}>
        <Text style={{ fontSize: 13, lineHeight: 19, color: c.muted }}>{Math.round(item.total / total * 100)}% de las ventas</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.text, fontVariant: ['tabular-nums'] }}>{formatCurrency(item.total)}</Text>
      </View>
      <Bar value={item.total} max={total} />
    </View>)}
  </View>;
}

export function HourlyOrdersChart({ data, compareData }: { data: HourlySales[]; compareData: HourlySales[] }) {
  const c = useDesignColors();
  const comparison = new Map(compareData.map((item) => [item.hour, item.orders]));
  const hours = [...new Set([...data.map((item) => item.hour), ...comparison.keys()])].sort((a, b) => a - b);
  const current = new Map(data.map((item) => [item.hour, item.orders]));
  const active = hours.filter((hour) => (current.get(hour) ?? 0) > 0 || (comparison.get(hour) ?? 0) > 0);
  const max = Math.max(0, ...data.map((item) => item.orders), ...compareData.map((item) => item.orders));
  if (!active.length) return <EmptyReport>No hay órdenes registradas en las horas consultadas.</EmptyReport>;
  return <View style={{ gap: 16 }}>
    {compareData.length > 0 && <Text style={{ fontSize: 13, lineHeight: 19, color: c.muted }}>Primera barra: fecha consultada. Segunda: fecha de comparación.</Text>}
    {active.map((hour) => <View key={hour} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 }}>
        <Text style={{ fontSize: 13, lineHeight: 19, color: c.muted }}>{String(hour).padStart(2, '0')}:00</Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: c.text }}>{current.get(hour) ?? 0} órdenes{compareData.length ? ` · Comparación: ${comparison.get(hour) ?? 0}` : ''}</Text>
      </View>
      <Bar value={current.get(hour) ?? 0} max={max} />
      {compareData.length > 0 && <Bar value={comparison.get(hour) ?? 0} max={max} comparison />}
    </View>)}
  </View>;
}

export function TopProductsList({ data }: { data: TopProduct[] }) {
  const c = useDesignColors();
  if (!data.length) return <EmptyReport>No hay productos vendidos en este período.</EmptyReport>;
  return <View>
    {data.map((item, index) => <View key={`${item.dishName}-${index}`} style={{ gap: 6, paddingVertical: 12, borderTopWidth: index ? 1 : 0, borderColor: c.separator }}>
      <Text style={{ fontSize: 15, lineHeight: 22, color: c.text, fontWeight: '600' }}>{index + 1}. {item.dishName}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 }}>
        <Text style={{ fontSize: 13, lineHeight: 20, color: c.muted }}>{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.text, fontVariant: ['tabular-nums'] }}>{formatCurrency(item.total)}</Text>
      </View>
    </View>)}
  </View>;
}
