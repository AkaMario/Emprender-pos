import React, { useCallback, useEffect, useState } from "react";
import { advancePreparationTask, getPreparationTasks, type PreparationTask } from "@/database/pos-database";
import { Button, Card, Copy, ErrorText, Heading, Page, errorMessage } from "./ui";
import { useBusinessQuery } from "./use-query";

export function PreparationScreen() {
  const load = useCallback(() => getPreparationTasks(), []);
  const { data, error, setError, reload } = useBusinessQuery(load, []);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (busy) return;
    const interval = setInterval(() => { void reload(); }, 5000);
    return () => clearInterval(interval);
  }, [busy, reload]);
  async function advance(task: PreparationTask) {
    if (busy) return;
    setBusy(true);
    try { await advancePreparationTask(task.id, task.state); await reload(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <Page><Heading>Comandas y preparación</Heading><Copy>Las nuevas ventas crean una comanda. Los insumos se descuentan al confirmar la venta.</Copy><Button title="Actualizar comandas" secondary disabled={busy} onPress={() => { void reload(); }} /><ErrorText message={error} />
    {!data.length && <Copy>No hay preparaciones pendientes.</Copy>}
    {data.map((task) => <Card key={task.id}><Heading>{task.quantity} × {task.dish_name_snapshot}</Heading><Copy>Venta #{task.sale_id} · {task.order_type}{task.table_number ? ` · Mesa ${task.table_number}` : ""}</Copy><Copy>{task.state === "queued" ? "En cola" : task.state === "preparing" ? "En preparación" : "Listo"} · {new Date(task.created_at).toLocaleTimeString("es-CO")}</Copy><Button title={task.state === "queued" ? "Comenzar preparación" : task.state === "preparing" ? "Marcar listo" : "Registrar entrega"} disabled={busy} onPress={() => { void advance(task); }} /></Card>)}
  </Page>;
}
