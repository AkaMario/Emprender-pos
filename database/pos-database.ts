import { getDatabase } from "./auth-database";

export type DishCategory = "Coctel Tradicional" | "Especial de Casa" | "Bebida" | "Otro";
export type OrderType = "Mesa" | "Domicilio" | "Para Llevar";
export type PaymentMethod = "Efectivo" | "Transferencia";
export type SaleStatus = "Completada" | "Cancelada";
export type InventoryCategory = "Fresco" | "Congelado" | "Bebida" | "Otro";
export type InventoryUnit = "kg" | "lt" | "und" | "atado";
export type InventoryStatus = "OK" | "Bajo" | "Critico";
export type InventoryMovementType = "entry" | "stock_out" | "sale" | "cancel";

export type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  size: string;
  imageUri: string | null;
  isActive: boolean;
  stockStatus: "Disponible" | "Bajo Stock" | "Sin Stock";
  ingredients: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
};

export type InventoryItem = {
  id: number;
  name: string;
  unit: string;
  category: InventoryCategory;
  currentQuantity: number;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  status: InventoryStatus;
};

export type InventoryMovement = {
  id: number;
  inventoryItemId: number;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  supplier: string | null;
  invoiceNumber: string | null;
  unitCost: number | null;
  notes: string | null;
  createdAt: number;
};

export type SaleSummary = {
  id: number;
  saleNumber: string;
  dishName: string;
  orderType: OrderType;
  createdAt: number;
  total: number;
  status: SaleStatus;
};

export type DashboardKpis = {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  salesComparison: number;
  ordersComparison: number;
  averageComparison: number;
};

export type AlertItem = {
  id: number;
  type: string;
  entityName: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  resolvedAt: number | null;
  status: string;
};

export type SaleDetail = {
  id: number;
  saleNumber: string;
  orderType: OrderType;
  tableNumber: string | null;
  customerName: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod | null;
  amountReceived: number | null;
  changeAmount: number | null;
  transferReference: string | null;
  status: SaleStatus;
  cancellationReason: string | null;
  createdAt: number;
  items: Array<{
    id: number;
    dishName: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }>;
};

export type ReportPeriod = "Dia" | "Semana" | "Mes" | "Personalizado";

export type SalesByDay = {
  day: string;
  total: number;
  isToday: boolean;
};

export type CategorySales = {
  category: DishCategory;
  total: number;
  percentage: number;
};

export type HourlySales = {
  hour: number;
  orders: number;
};

export type TopProduct = {
  dishName: string;
  quantity: number;
  total: number;
};

export type ReportsData = {
  rangeStart: number;
  rangeEnd: number;
  totalSales: number;
  totalOrders: number;
  salesByDay: SalesByDay[];
  categorySales: CategorySales[];
  hourlySales: HourlySales[];
  compareHourlySales: HourlySales[];
  topProducts: TopProduct[];
};

export type UpsertDishInput = {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  size: string;
  imageUri?: string | null;
  recipeItems?: Array<{ inventoryItemId: number; quantity: number }>;
  isActive?: boolean;
};

export type CartItemInput = {
  dishId: number;
  quantity: number;
};

export type CreateSaleInput = {
  orderType: OrderType;
  tableNumber?: string;
  customerId?: number | null;
  customerName?: string;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  transferReference?: string;
  items: CartItemInput[];
};

type DishRow = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  size: string;
  image_uri: string | null;
  is_active: number;
  stock_status: "Disponible" | "Bajo Stock" | "Sin Stock" | null;
  ingredients: string | null;
};

type SaleSummaryRow = {
  id: number;
  sale_number: string;
  dish_name: string | null;
  order_type: OrderType;
  created_at: number;
  total: number;
  status: SaleStatus;
};

type CustomerRow = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
};

type InventoryItemRow = {
  id: number;
  name: string;
  unit: string;
  category: InventoryCategory;
  current_quantity: number;
  low_stock_threshold: number;
  critical_stock_threshold: number;
};

type InventoryMovementRow = {
  id: number;
  inventory_item_id: number;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  supplier: string | null;
  invoice_number: string | null;
  unit_cost: number | null;
  notes: string | null;
  created_at: number;
};

type AlertRow = {
  id: number;
  type: string;
  entity_name: string;
  message: string;
  source_key: string | null;
  status: string;
  is_read: number;
  created_at: number;
  resolved_at: number | null;
};

type SaleDetailRow = {
  id: number;
  sale_number: string;
  order_type: OrderType;
  table_number: string | null;
  customer_name: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod | null;
  amount_received: number | null;
  change_amount: number | null;
  transfer_reference: string | null;
  status: SaleStatus;
  cancellation_reason: string | null;
  created_at: number;
};

type SaleDetailItemRow = {
  id: number;
  dish_name: string;
  unit_price: number;
  quantity: number;
  total: number;
};

type SaleItemJoinRow = {
  dish_id: number;
  quantity: number;
};

type CategorySalesRow = {
  category: DishCategory;
  total: number;
};

type HourlySalesRow = {
  hour: number;
  orders: number;
};

type TopProductRow = {
  dish_name: string;
  quantity: number;
  total: number;
};

type ExportSaleRow = {
  sale_number: string;
  created_at: number;
  order_type: OrderType;
  status: SaleStatus;
  dish_name: string;
  quantity: number;
  unit_price: number;
  item_total: number;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod | null;
};

const DAY_START_HOUR = 13;
const DAY_END_HOUR = 23;
const DAY_END_MINUTE = 30;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSaleTime(value: number) {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function mapDish(row: DishRow): Dish {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    size: row.size,
    imageUri: row.image_uri,
    isActive: row.is_active === 1,
    stockStatus: row.stock_status ?? "Disponible",
    ingredients: row.ingredients ?? "",
  };
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
  };
}

function mapInventoryItem(row: InventoryItemRow): InventoryItem {
  const status = getInventoryStatus(
    row.current_quantity,
    row.low_stock_threshold,
    row.critical_stock_threshold
  );

  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    category: row.category,
    currentQuantity: row.current_quantity,
    lowStockThreshold: row.low_stock_threshold,
    criticalStockThreshold: row.critical_stock_threshold,
    status,
  };
}

function mapInventoryMovement(row: InventoryMovementRow): InventoryMovement {
  return {
    id: row.id,
    inventoryItemId: row.inventory_item_id,
    type: row.type,
    quantity: row.quantity,
    reason: row.reason,
    supplier: row.supplier,
    invoiceNumber: row.invoice_number,
    unitCost: row.unit_cost,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapSaleSummary(row: SaleSummaryRow): SaleSummary {
  return {
    id: row.id,
    saleNumber: row.sale_number,
    dishName: row.dish_name ?? "Venta sin items",
    orderType: row.order_type,
    createdAt: row.created_at,
    total: row.total,
    status: row.status,
  };
}

function mapAlert(row: AlertRow): AlertItem {
  return {
    id: row.id,
    type: row.type,
    entityName: row.entity_name,
    message: row.message,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    status: row.status,
  };
}

function getInventoryStatus(
  currentQuantity: number,
  lowStockThreshold: number,
  criticalStockThreshold: number
): InventoryStatus {
  if (currentQuantity <= criticalStockThreshold) {
    return "Critico";
  }
  if (currentQuantity <= lowStockThreshold) {
    return "Bajo";
  }

  return "OK";
}

function getBusinessWindow(date: Date, dayOffset = 0) {
  const start = new Date(date);
  start.setDate(start.getDate() + dayOffset);
  start.setHours(DAY_START_HOUR, 0, 0, 0);

  const end = new Date(date);
  end.setDate(end.getDate() + dayOffset);
  end.setHours(DAY_END_HOUR, DAY_END_MINUTE, 0, 0);

  return { start: start.getTime(), end: end.getTime() };
}

function getDayWindow(date: Date) {
  const start = new Date(date);
  start.setHours(DAY_START_HOUR, 0, 0, 0);

  const end = new Date(date);
  end.setHours(DAY_END_HOUR, DAY_END_MINUTE, 0, 0);

  return { start: start.getTime(), end: end.getTime() };
}

function getWeekWindow(date: Date) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start: start.getTime(), end: end.getTime() };
}

function getReportWindow(period: ReportPeriod, date = new Date()) {
  if (period === "Dia") {
    return getDayWindow(date);
  }

  if (period === "Semana") {
    return getWeekWindow(date);
  }

  if (period === "Mes") {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    return { start: start.getTime(), end: end.getTime() };
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start: start.getTime(), end: end.getTime() };
}

function parseReportDate(value?: string) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function comparePercent(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function normalizeCategoryFilter(category: string) {
  if (category === "Cocteles") {
    return "Coctel Tradicional";
  }
  if (category === "Especial") {
    return "Especial de Casa";
  }
  if (category === "Bebidas") {
    return "Bebida";
  }

  return category;
}

export async function getDishes(options?: { search?: string; category?: string; includeInactive?: boolean }) {
  const db = await getDatabase();
  const search = `%${(options?.search ?? "").trim().toLowerCase()}%`;
  const category = normalizeCategoryFilter(options?.category ?? "Todos");
  const includeInactive = options?.includeInactive ? 1 : 0;

  const rows = await db.getAllAsync<DishRow>(
    `SELECT
      dishes.*,
      COALESCE(GROUP_CONCAT(inventory_items.name, ' '), '') as ingredients,
      CASE
        WHEN COUNT(dish_recipes.id) = 0 THEN 'Disponible'
        WHEN MIN(CASE WHEN inventory_items.current_quantity >= dish_recipes.quantity THEN 1 ELSE 0 END) = 0 THEN 'Sin Stock'
        WHEN MIN(CASE WHEN inventory_items.current_quantity - dish_recipes.quantity <= inventory_items.low_stock_threshold THEN 1 ELSE 0 END) = 1 THEN 'Bajo Stock'
        ELSE 'Disponible'
      END as stock_status
     FROM dishes
     LEFT JOIN dish_recipes ON dish_recipes.dish_id = dishes.id
     LEFT JOIN inventory_items ON inventory_items.id = dish_recipes.inventory_item_id
     WHERE (? = 1 OR dishes.is_active = 1)
       AND (? = 'Todos' OR dishes.category = ?)
       AND (LOWER(dishes.name) LIKE ? OR LOWER(COALESCE(inventory_items.name, '')) LIKE ?)
     GROUP BY dishes.id
     ORDER BY dishes.created_at DESC`,
    [includeInactive, category, category, search, search]
  );

  return rows.map(mapDish);
}

export async function getDishById(id: number) {
  const rows = await getDishes({ includeInactive: true });

  return rows.find((dish) => dish.id === id) ?? null;
}

export async function getDishRecipeItems(dishId: number) {
  const db = await getDatabase();

  return db.getAllAsync<{ inventoryItemId: number; quantity: number }>(
    `SELECT inventory_item_id as inventoryItemId, quantity
     FROM dish_recipes
     WHERE dish_id = ?`,
    [dishId]
  );
}

export async function upsertDish(input: UpsertDishInput) {
  const db = await getDatabase();
  const now = Date.now();

  if (input.price < 0) {
    throw new Error("El precio debe ser un numero positivo.");
  }

  if (input.id) {
    const dishId = input.id;
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE dishes
         SET name = ?, description = ?, price = ?, category = ?, size = ?, image_uri = ?, is_active = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.name,
          input.description,
          input.price,
          input.category,
          input.size,
          input.imageUri ?? null,
          input.isActive === false ? 0 : 1,
          now,
          dishId,
        ]
      );
      await replaceDishRecipe(dishId, input.recipeItems ?? []);
    });
    return dishId;
  }

  let dishId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO dishes (name, description, price, category, size, image_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.name, input.description, input.price, input.category, input.size, input.imageUri ?? null, now, now]
    );
    dishId = result.lastInsertRowId;
    await replaceDishRecipe(dishId, input.recipeItems ?? []);
  });

  return dishId;
}

async function replaceDishRecipe(
  dishId: number,
  recipeItems: Array<{ inventoryItemId: number; quantity: number }>
) {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM dish_recipes WHERE dish_id = ?", [dishId]);

  for (const item of recipeItems) {
    if (item.quantity > 0) {
      await db.runAsync(
        "INSERT INTO dish_recipes (dish_id, inventory_item_id, quantity) VALUES (?, ?, ?)",
        [dishId, item.inventoryItemId, item.quantity]
      );
    }
  }
}

export async function deleteOrDeactivateDish(id: number) {
  const db = await getDatabase();
  const sales = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sale_items WHERE dish_id = ?",
    [id]
  );

  if ((sales?.count ?? 0) > 0) {
    await db.runAsync("UPDATE dishes SET is_active = 0, updated_at = ? WHERE id = ?", [Date.now(), id]);
    return "deactivated" as const;
  }

  await db.runAsync("DELETE FROM dishes WHERE id = ?", [id]);
  return "deleted" as const;
}

export async function getCustomers() {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CustomerRow>("SELECT * FROM customers ORDER BY name ASC");

  return rows.map(mapCustomer);
}

export async function getInventoryItems(options?: {
  search?: string;
  category?: string;
  sortBy?: "name" | "stock";
  criticalFirst?: boolean;
}) {
  const db = await getDatabase();
  const search = `%${(options?.search ?? "").trim().toLowerCase()}%`;
  const category = options?.category ?? "Todos";
  const orderBy = options?.criticalFirst
    ? `CASE
        WHEN current_quantity <= critical_stock_threshold THEN 0
        WHEN current_quantity <= low_stock_threshold THEN 1
        ELSE 2
      END ASC, name ASC`
    : options?.sortBy === "stock"
      ? "current_quantity ASC, name ASC"
      : "name ASC";
  const rows = await db.getAllAsync<InventoryItemRow>(
    `SELECT * FROM inventory_items
     WHERE LOWER(name) LIKE ? AND (? = 'Todos' OR category = ?)
     ORDER BY ${orderBy}`,
    [search, category, category]
  );

  return rows.map(mapInventoryItem);
}

export async function createInventoryItem(input: {
  name: string;
  unit: InventoryUnit;
  category: InventoryCategory;
  currentQuantity: number;
  lowStockThreshold: number;
  criticalStockThreshold?: number;
}) {
  const db = await getDatabase();
  const now = Date.now();
  const criticalStockThreshold =
    input.criticalStockThreshold ?? Math.max(0, input.lowStockThreshold / 2);
  const result = await db.runAsync(
    `INSERT INTO inventory_items (
      name, unit, category, current_quantity, low_stock_threshold, critical_stock_threshold, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name.trim(),
      input.unit.trim(),
      input.category,
      input.currentQuantity,
      input.lowStockThreshold,
      criticalStockThreshold,
      now,
      now,
    ]
  );

  await refreshStockAlerts();
  return result.lastInsertRowId;
}

export async function adjustInventoryItem(input: {
  inventoryItemId: number;
  type: "entry" | "stock_out";
  quantity: number;
  reason: string;
  supplier?: string;
  invoiceNumber?: string;
  unitCost?: number | null;
  notes?: string;
}) {
  if (input.quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a cero.");
  }

  const db = await getDatabase();
  const multiplier = input.type === "entry" ? 1 : -1;
  const quantity = input.quantity * multiplier;

  await db.withTransactionAsync(async () => {
    const item = await db.getFirstAsync<{ current_quantity: number }>(
      "SELECT current_quantity FROM inventory_items WHERE id = ? LIMIT 1",
      [input.inventoryItemId]
    );

    if (!item) {
      throw new Error("Insumo no encontrado.");
    }

    if (item.current_quantity + quantity < 0) {
      throw new Error("La salida supera el stock disponible.");
    }

    await db.runAsync(
      "UPDATE inventory_items SET current_quantity = current_quantity + ?, updated_at = ? WHERE id = ?",
      [quantity, Date.now(), input.inventoryItemId]
    );
    await db.runAsync(
      `INSERT INTO inventory_movements (
        inventory_item_id, type, quantity, reason, supplier, invoice_number, unit_cost, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.inventoryItemId,
        input.type,
        input.quantity,
        input.reason.trim(),
        input.supplier?.trim() || null,
        input.invoiceNumber?.trim() || null,
        input.unitCost ?? null,
        input.notes?.trim() || null,
        Date.now(),
      ]
    );
  });

  await refreshStockAlerts();
}

export async function getInventoryItemById(id: number) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<InventoryItemRow>(
    "SELECT * FROM inventory_items WHERE id = ? LIMIT 1",
    [id]
  );

  return row ? mapInventoryItem(row) : null;
}

export async function getInventoryMovements(options: {
  inventoryItemId: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}) {
  const db = await getDatabase();
  const params: Array<string | number> = [options.inventoryItemId];
  const filters = ["inventory_item_id = ?"];

  if (options.type && options.type !== "Todos") {
    filters.push("type = ?");
    params.push(options.type);
  }

  if (options.startDate) {
    const start = parseReportDate(options.startDate);
    start.setHours(0, 0, 0, 0);
    filters.push("created_at >= ?");
    params.push(start.getTime());
  }

  if (options.endDate) {
    const end = parseReportDate(options.endDate);
    end.setHours(23, 59, 59, 999);
    filters.push("created_at <= ?");
    params.push(end.getTime());
  }

  const rows = await db.getAllAsync<InventoryMovementRow>(
    `SELECT * FROM inventory_movements
     WHERE ${filters.join(" AND ")}
     ORDER BY created_at DESC`,
    params
  );

  return rows.map(mapInventoryMovement);
}

export async function createCustomer(name: string) {
  const db = await getDatabase();
  const now = Date.now();
  const result = await db.runAsync(
    "INSERT INTO customers (name, created_at, updated_at) VALUES (?, ?, ?)",
    [name.trim(), now, now]
  );

  return result.lastInsertRowId;
}

export async function getNextSaleNumber() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ next_id: number }>(
    "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM sales"
  );

  return `V-${String(row?.next_id ?? 1).padStart(4, "0")}`;
}

export async function createCompletedSale(input: CreateSaleInput) {
  const db = await getDatabase();

  if (input.items.length === 0) {
    throw new Error("Agrega al menos un plato al carrito.");
  }

  const now = Date.now();
  let createdSaleId = 0;

  await db.withTransactionAsync(async () => {
    const saleNumber = await getNextSaleNumber();
    const dishes = await getDishes();
    const items = input.items.map((item) => {
      const dish = dishes.find((candidate) => candidate.id === item.dishId);

      if (!dish || dish.stockStatus === "Sin Stock") {
        throw new Error("Uno de los platos no esta disponible.");
      }

      return { ...item, dish };
    });
    const subtotal = items.reduce((total, item) => total + item.dish.price * item.quantity, 0);
    const total = subtotal + input.deliveryFee;
    const changeAmount = input.paymentMethod === "Efectivo" ? (input.amountReceived ?? 0) - total : 0;

    if (input.paymentMethod === "Efectivo" && changeAmount < 0) {
      throw new Error("El monto recibido no cubre el total.");
    }

    let customerId = input.customerId ?? null;
    if (input.orderType === "Domicilio" && !customerId && input.customerName?.trim()) {
      customerId = await createCustomer(input.customerName);
    }

    const result = await db.runAsync(
      `INSERT INTO sales (
        sale_number, order_type, table_number, customer_id, customer_name, subtotal, delivery_fee,
        total, payment_method, amount_received, change_amount, transfer_reference, status, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completada', ?, ?)`,
      [
        saleNumber,
        input.orderType,
        input.tableNumber ?? null,
        customerId,
        input.customerName?.trim() || null,
        subtotal,
        input.deliveryFee,
        total,
        input.paymentMethod,
        input.amountReceived ?? null,
        changeAmount,
        input.transferReference?.trim() || null,
        now,
        now,
      ]
    );
    createdSaleId = result.lastInsertRowId;

    for (const item of items) {
      await db.runAsync(
        `INSERT INTO sale_items (sale_id, dish_id, dish_name, unit_price, quantity, total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [createdSaleId, item.dish.id, item.dish.name, item.dish.price, item.quantity, item.dish.price * item.quantity]
      );
      await applyInventoryForDish(item.dish.id, item.quantity, createdSaleId, "sale");
    }

    await refreshStockAlerts();
  });

  return createdSaleId;
}

async function applyInventoryForDish(
  dishId: number,
  quantity: number,
  saleId: number,
  movementType: "sale" | "cancel"
) {
  const db = await getDatabase();
  const recipes = await db.getAllAsync<{
    inventory_item_id: number;
    quantity: number;
  }>("SELECT inventory_item_id, quantity FROM dish_recipes WHERE dish_id = ?", [dishId]);
  const multiplier = movementType === "sale" ? -1 : 1;

  for (const recipe of recipes) {
    const movementQuantity = recipe.quantity * quantity * multiplier;
    await db.runAsync(
      "UPDATE inventory_items SET current_quantity = current_quantity + ?, updated_at = ? WHERE id = ?",
      [movementQuantity, Date.now(), recipe.inventory_item_id]
    );
    await db.runAsync(
      `INSERT INTO inventory_movements (inventory_item_id, sale_id, type, quantity, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        recipe.inventory_item_id,
        saleId,
        movementType,
        Math.abs(movementQuantity),
        movementType === "sale" ? "Venta completada" : "Venta cancelada",
        Date.now(),
      ]
    );
  }
}

export async function cancelSale(id: number, reason: string) {
  if (!reason.trim()) {
    throw new Error("El motivo de cancelacion es obligatorio.");
  }

  const db = await getDatabase();
  const sale = await db.getFirstAsync<{ status: SaleStatus }>(
    "SELECT status FROM sales WHERE id = ? LIMIT 1",
    [id]
  );

  if (!sale || sale.status === "Cancelada") {
    throw new Error("La venta no esta disponible para cancelar.");
  }

  const items = await db.getAllAsync<SaleItemJoinRow>(
    "SELECT dish_id, quantity FROM sale_items WHERE sale_id = ?",
    [id]
  );

  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await applyInventoryForDish(item.dish_id, item.quantity, id, "cancel");
    }

    await db.runAsync(
      `UPDATE sales
       SET status = 'Cancelada', cancellation_reason = ?, cancelled_at = ?
       WHERE id = ?`,
      [reason.trim(), Date.now(), id]
    );
    await db.runAsync(
      `INSERT INTO alerts (type, entity_name, message, source_key, created_at)
       VALUES ('Orden cancelada', ?, ?, ?, ?)`,
      [`Venta #${id}`, reason.trim(), `sale_cancel:${id}`, Date.now()]
    );
  });
}

export async function getRecentSales(limit = 10) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SaleSummaryRow>(
    `SELECT sales.id, sales.sale_number, sales.order_type, sales.created_at, sales.total, sales.status,
      (SELECT sale_items.dish_name FROM sale_items WHERE sale_items.sale_id = sales.id ORDER BY sale_items.id ASC LIMIT 1) as dish_name
     FROM sales
     ORDER BY sales.created_at DESC
     LIMIT ?`,
    [limit]
  );

  return rows.map(mapSaleSummary);
}

export async function getSaleDetail(id: number) {
  const db = await getDatabase();
  const sale = await db.getFirstAsync<SaleDetailRow>(
    "SELECT * FROM sales WHERE id = ? LIMIT 1",
    [id]
  );

  if (!sale) {
    return null;
  }

  const items = await db.getAllAsync<SaleDetailItemRow>(
    "SELECT id, dish_name, unit_price, quantity, total FROM sale_items WHERE sale_id = ? ORDER BY id ASC",
    [id]
  );

  return {
    id: sale.id,
    saleNumber: sale.sale_number,
    orderType: sale.order_type,
    tableNumber: sale.table_number,
    customerName: sale.customer_name,
    subtotal: sale.subtotal,
    deliveryFee: sale.delivery_fee,
    total: sale.total,
    paymentMethod: sale.payment_method,
    amountReceived: sale.amount_received,
    changeAmount: sale.change_amount,
    transferReference: sale.transfer_reference,
    status: sale.status,
    cancellationReason: sale.cancellation_reason,
    createdAt: sale.created_at,
    items: items.map((item) => ({
      id: item.id,
      dishName: item.dish_name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      total: item.total,
    })),
  } satisfies SaleDetail;
}

export async function getDashboardKpis(date = new Date()) {
  const db = await getDatabase();
  const today = getBusinessWindow(date);
  const yesterday = getBusinessWindow(date, -1);
  const current = await db.getFirstAsync<{ total: number | null; orders: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as orders
     FROM sales
     WHERE status = 'Completada' AND created_at BETWEEN ? AND ?`,
    [today.start, today.end]
  );
  const previous = await db.getFirstAsync<{ total: number | null; orders: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as orders
     FROM sales
     WHERE status = 'Completada' AND created_at BETWEEN ? AND ?`,
    [yesterday.start, yesterday.end]
  );
  const todaySales = current?.total ?? 0;
  const todayOrders = current?.orders ?? 0;
  const previousSales = previous?.total ?? 0;
  const previousOrders = previous?.orders ?? 0;
  const averageTicket = todayOrders > 0 ? Math.round(todaySales / todayOrders) : 0;
  const previousAverage = previousOrders > 0 ? Math.round(previousSales / previousOrders) : 0;

  return {
    todaySales,
    todayOrders,
    averageTicket,
    salesComparison: comparePercent(todaySales, previousSales),
    ordersComparison: comparePercent(todayOrders, previousOrders),
    averageComparison: comparePercent(averageTicket, previousAverage),
  };
}

export async function refreshStockAlerts() {
  const db = await getDatabase();
  const items = await db.getAllAsync<{
    id: number;
    name: string;
    current_quantity: number;
    low_stock_threshold: number;
    critical_stock_threshold: number;
  }>("SELECT * FROM inventory_items");

  for (const item of items) {
    const sourceKey = `stock:${item.id}`;
    const type =
      item.current_quantity <= item.critical_stock_threshold
        ? "Stock critico"
        : item.current_quantity <= item.low_stock_threshold
          ? "Stock bajo"
          : null;

    if (type) {
      const existing = await db.getFirstAsync<{ id: number; resolved_at: number | null }>(
        "SELECT id, resolved_at FROM alerts WHERE source_key = ? LIMIT 1",
        [sourceKey]
      );

      if (existing && existing.resolved_at === null) {
        await db.runAsync(
          `UPDATE alerts
           SET type = ?, entity_name = ?, message = ?
           WHERE id = ?`,
          [
            type,
            item.name,
            `${item.name}: ${item.current_quantity} disponible, minimo ${item.low_stock_threshold}`,
            existing.id,
          ]
        );
      } else if (!existing || existing.resolved_at !== null) {
        await db.runAsync(
          `INSERT OR REPLACE INTO alerts (
            id, type, entity_name, message, source_key, status, is_read, created_at, resolved_at
          ) VALUES (?, ?, ?, ?, ?, 'Pendiente', 0, ?, NULL)`,
          [
            existing?.id ?? null,
            type,
            item.name,
            `${item.name}: ${item.current_quantity} disponible, minimo ${item.low_stock_threshold}`,
            sourceKey,
            Date.now(),
          ]
        );
      }
    } else {
      await db.runAsync(
        "UPDATE alerts SET resolved_at = ?, is_read = 1 WHERE source_key = ? AND resolved_at IS NULL",
        [Date.now(), sourceKey]
      );
    }
  }
}

export async function getAlerts() {
  await refreshStockAlerts();
  const db = await getDatabase();
  const rows = await db.getAllAsync<AlertRow>(
    `SELECT * FROM alerts
     WHERE resolved_at IS NULL AND is_read = 0
     ORDER BY created_at DESC
     LIMIT 30`
  );

  return rows.map(mapAlert);
}

export async function getUnreadAlertsCount() {
  await refreshStockAlerts();
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM alerts WHERE is_read = 0 AND resolved_at IS NULL"
  );

  return row?.count ?? 0;
}

export async function markAlertAsRead(id: number) {
  const db = await getDatabase();
  await db.runAsync("UPDATE alerts SET is_read = 1 WHERE id = ?", [id]);
}

export async function markAlertAsReordering(id: number) {
  const db = await getDatabase();
  await db.runAsync("UPDATE alerts SET status = 'En proceso' WHERE id = ?", [id]);
}

export async function getReportsData(options?: {
  period?: ReportPeriod;
  date?: string;
  compareDate?: string;
  topLimit?: number;
}) {
  const db = await getDatabase();
  const period = options?.period ?? "Dia";
  const reportDate = parseReportDate(options?.date);
  const range = getReportWindow(period, reportDate);
  const weekRange = getWeekWindow(reportDate);
  const summary = await db.getFirstAsync<{ total: number; orders: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as orders
     FROM sales
     WHERE status = 'Completada' AND created_at BETWEEN ? AND ?`,
    [range.start, range.end]
  );

  const weekRows = await db.getAllAsync<{ weekday: string; total: number }>(
    `SELECT strftime('%w', datetime(created_at / 1000, 'unixepoch', 'localtime')) as weekday,
      COALESCE(SUM(total), 0) as total
     FROM sales
     WHERE status = 'Completada' AND created_at BETWEEN ? AND ?
     GROUP BY weekday`,
    [weekRange.start, weekRange.end]
  );
  const weekdayTotals = new Map(weekRows.map((row) => [Number(row.weekday), row.total]));
  const today = new Date();
  const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const salesByDay = dayLabels.map((day, index) => {
    const sqliteWeekday = index === 6 ? 0 : index + 1;
    const dayDate = new Date(weekRange.start);
    dayDate.setDate(dayDate.getDate() + index);

    return {
      day,
      total: weekdayTotals.get(sqliteWeekday) ?? 0,
      isToday: dayDate.toDateString() === today.toDateString(),
    };
  });

  const categoryRows = await db.getAllAsync<CategorySalesRow>(
    `SELECT dishes.category as category, COALESCE(SUM(sale_items.total), 0) as total
     FROM sale_items
     INNER JOIN sales ON sales.id = sale_items.sale_id
     INNER JOIN dishes ON dishes.id = sale_items.dish_id
     WHERE sales.status = 'Completada' AND sales.created_at BETWEEN ? AND ?
     GROUP BY dishes.category`,
    [range.start, range.end]
  );
  const categoryTotal = categoryRows.reduce((total, row) => total + row.total, 0);
  const categories: DishCategory[] = ["Coctel Tradicional", "Especial de Casa", "Bebida", "Otro"];
  const categorySales = categories.map((category) => {
    const total = categoryRows.find((row) => row.category === category)?.total ?? 0;

    return {
      category,
      total,
      percentage: categoryTotal > 0 ? Math.round((total / categoryTotal) * 100) : 0,
    };
  });

  const dayRange = getDayWindow(reportDate);
  const hourlyRows = await db.getAllAsync<HourlySalesRow>(
    `SELECT CAST(strftime('%H', datetime(created_at / 1000, 'unixepoch', 'localtime')) AS INTEGER) as hour,
      COUNT(*) as orders
     FROM sales
     WHERE status = 'Completada' AND created_at BETWEEN ? AND ?
     GROUP BY hour`,
    [dayRange.start, dayRange.end]
  );
  const hourlyMap = new Map(hourlyRows.map((row) => [row.hour, row.orders]));
  const hourlySales = Array.from({ length: 11 }, (_, index) => {
    const hour = 13 + index;
    return { hour, orders: hourlyMap.get(hour) ?? 0 };
  });

  const compareDate = options?.compareDate ? parseReportDate(options.compareDate) : null;
  const compareHourlySales = compareDate
    ? await getHourlySalesForDate(compareDate)
    : [];

  const topRows = await db.getAllAsync<TopProductRow>(
    `SELECT sale_items.dish_name,
      COALESCE(SUM(sale_items.quantity), 0) as quantity,
      COALESCE(SUM(sale_items.total), 0) as total
     FROM sale_items
     INNER JOIN sales ON sales.id = sale_items.sale_id
     WHERE sales.status = 'Completada' AND sales.created_at BETWEEN ? AND ?
     GROUP BY sale_items.dish_name
     ORDER BY quantity DESC, total DESC
     LIMIT ?`,
    [range.start, range.end, options?.topLimit ?? 10]
  );

  return {
    rangeStart: range.start,
    rangeEnd: range.end,
    totalSales: summary?.total ?? 0,
    totalOrders: summary?.orders ?? 0,
    salesByDay,
    categorySales,
    hourlySales,
    compareHourlySales,
    topProducts: topRows.map((row) => ({
      dishName: row.dish_name,
      quantity: row.quantity,
      total: row.total,
    })),
  } satisfies ReportsData;
}

async function getHourlySalesForDate(date: Date) {
  const db = await getDatabase();
  const range = getDayWindow(date);
  const rows = await db.getAllAsync<HourlySalesRow>(
    `SELECT CAST(strftime('%H', datetime(created_at / 1000, 'unixepoch', 'localtime')) AS INTEGER) as hour,
      COUNT(*) as orders
     FROM sales
     WHERE status = 'Completada' AND created_at BETWEEN ? AND ?
     GROUP BY hour`,
    [range.start, range.end]
  );
  const hourlyMap = new Map(rows.map((row) => [row.hour, row.orders]));

  return Array.from({ length: 11 }, (_, index) => {
    const hour = 13 + index;
    return { hour, orders: hourlyMap.get(hour) ?? 0 };
  });
}

export async function getSalesExportRowsForDate(dateText?: string) {
  const db = await getDatabase();
  const date = parseReportDate(dateText);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return db.getAllAsync<ExportSaleRow>(
    `SELECT sales.sale_number, sales.created_at, sales.order_type, sales.status,
      sale_items.dish_name, sale_items.quantity, sale_items.unit_price,
      sale_items.total as item_total, sales.subtotal, sales.delivery_fee,
      sales.total, sales.payment_method
     FROM sales
     INNER JOIN sale_items ON sale_items.sale_id = sales.id
     WHERE sales.created_at BETWEEN ? AND ?
     ORDER BY sales.created_at ASC, sale_items.id ASC`,
    [start.getTime(), end.getTime()]
  );
}
