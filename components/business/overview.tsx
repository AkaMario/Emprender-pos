import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { useBusiness } from "@/context/business";
import {
  getBusinessOrders,
  getBusinessSummary,
} from "@/database/business-database";
import { formatMoney } from "@/domain/business";
import { Button, Card, Copy, ErrorText, Heading, Page } from "./ui";
import { useBusinessQuery } from "./use-query";

export function BusinessOverview({ reports = false }: { reports?: boolean }) {
  const { profile, definition } = useBusiness();
  const router = useRouter();
  const load = useCallback(
    async () => ({
      summary: await getBusinessSummary(),
      orders: await getBusinessOrders(),
    }),
    [],
  );
  const { data, error, loading } = useBusinessQuery<{
    summary: Awaited<ReturnType<typeof getBusinessSummary>> | null;
    orders: Awaited<ReturnType<typeof getBusinessOrders>>;
  }>(load, { summary: null, orders: [] });
  return (
    <Page>
      <Heading>{reports ? "Reportes" : profile?.name}</Heading>
      <Copy>{definition?.title}</Copy>
      <ErrorText message={error} />
      {!reports && (
        <Card>
          <Button
            title={
              profile?.model === "rental" ? "Nueva reserva" : "Nueva venta"
            }
            onPress={() => router.push("/(tabs)/sales")}
          />
          <Button
            title={definition?.catalog ?? "Catálogo"}
            secondary
            onPress={() => router.push("/(tabs)/menu")}
          />
          <Button
            title={definition?.operations ?? "Operaciones"}
            secondary
            onPress={() => router.push("/(tabs)/operations")}
          />
        </Card>
      )}
      {loading && <Copy>Cargando resumen…</Copy>}
      {data.summary && (
        <>
          <Card>
            <Copy>Ventas de hoy</Copy>
            <Heading>{formatMoney(data.summary.today.revenue)}</Heading>
            <Copy>
              {data.summary.today.count} operación(es) · Promedio:{" "}
              {formatMoney(
                data.summary.today.count
                  ? Math.round(
                      data.summary.today.revenue / data.summary.today.count,
                    )
                  : 0,
              )}
            </Copy>
          </Card>
          {reports && (
            <>
              <Card>
                <Copy>Ventas acumuladas</Copy>
                <Heading>{formatMoney(data.summary.all.revenue)}</Heading>
                <Copy>
                  {data.summary.all.count} operaciones vigentes. Las canceladas
                  se excluyen.
                </Copy>
              </Card>
              <Heading>Ingresos por categoría</Heading>
              {data.summary.categories.map((category) => (
                <Card key={category.category}>
                  <Copy>{category.category}</Copy>
                  <Heading>{formatMoney(category.revenue)}</Heading>
                </Card>
              ))}
            </>
          )}
          {profile?.model === "rental" && (
            <Card>
              <Heading>Garantías</Heading>
              <Copy>
                Pendientes de devolución:{" "}
                {formatMoney(data.summary.guarantees.outstanding)}
              </Copy>
              <Copy>
                Devueltas: {formatMoney(data.summary.guarantees.refunded)}
              </Copy>
              <Copy>
                Retenidas: {formatMoney(data.summary.guarantees.retained)}
              </Copy>
              <Copy>Se presentan separadas de los ingresos por alquiler.</Copy>
            </Card>
          )}
        </>
      )}
      <Heading>
        {reports ? "Últimas 100 operaciones" : "Últimas operaciones"}
      </Heading>
      {!data.orders.length && !loading && (
        <Copy>Tu primera operación aparecerá aquí.</Copy>
      )}
      {(reports ? data.orders : data.orders.slice(0, 5)).map((order) => (
        <Card key={order.id}>
          <Heading>
            Venta #{order.id} · {formatMoney(order.total_minor)}
          </Heading>
          <Copy>
            {order.customer_name || "Venta de mostrador"} ·{" "}
            {order.status === "cancelled" ? "Cancelada" : "Registrada"}
          </Copy>
          <Copy>{new Date(order.created_at).toLocaleString("es-CO")}</Copy>
          <Button
            title="Ver detalle"
            secondary
            onPress={() =>
              router.push({
                pathname: "/view/dashboard/sale-detail",
                params: { id: String(order.id) },
              })
            }
          />
        </Card>
      ))}
    </Page>
  );
}
