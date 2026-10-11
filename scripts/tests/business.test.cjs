/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const A = 1_000_000;

// Execute the actual TS repositories and migrations against SQLite in memory.
// Mock only the device APIs, keeping SQL, constraints and transactions real.
async function fixture(model, version = 3, platform = 'web', beforeMigration) {
  const sqlite = new DatabaseSync(':memory:');
  const baseline = fs.readFileSync(path.join(root, 'database/schema.sql'), 'utf8');
  if (version === 1) sqlite.exec(baseline.slice(0, baseline.indexOf('CREATE TABLE IF NOT EXISTS inventory_items')));
  else if (version !== 0) sqlite.exec(baseline);
  sqlite.exec(`PRAGMA user_version=${version}`);
  if (beforeMigration) beforeMigration(sqlite);
  const parameters = (args) => args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  const db = {
    execAsync: async (sql) => sqlite.exec(sql),
    getAllAsync: async (sql, ...args) => sqlite.prepare(sql).all(...parameters(args)),
    getFirstAsync: async (sql, ...args) => sqlite.prepare(sql).get(...parameters(args)) ?? null,
    runAsync: async (sql, ...args) => {
      const result = sqlite.prepare(sql).run(...parameters(args));
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },
    closeAsync: async () => {},
    async withTransactionAsync(work) {
      sqlite.exec('BEGIN');
      try { await work(); sqlite.exec('COMMIT'); }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const modules = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (!file.endsWith('.ts')) file += '.ts';
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} }; modules.set(file, module);
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: file,
    }).outputText;
    const requireMock = (name) => {
      if (name === 'react-native') return { Platform: { OS: platform } };
      if (name === 'expo-sqlite') return { openDatabaseAsync: async () => db };
      if (name === 'expo-file-system') return { File: class {}, Paths: {} };
      if (name === 'expo-crypto') return { randomUUID: crypto.randomUUID, getRandomBytes: crypto.randomBytes,
        CryptoDigestAlgorithm: { SHA256: 'sha256' }, digestStringAsync: async (_, value) => crypto.createHash('sha256').update(value).digest('hex') };
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
      return require(name);
    };
    new Function('require', 'module', 'exports', compiled)(requireMock, module, module.exports);
    return module.exports;
  }
  const auth = load('database/auth-database');
  const business = load('database/business-database');
  const domain = load('domain/business');
  try { await auth.getDatabase(); } catch (error) { sqlite.close(); throw error; }
  if (model) await business.selectBusiness({ name: 'Prueba', model });
  return { sqlite, db, business, domain, auth, tutorial: () => load('database/tutorial-database'), tutorials: () => load('domain/tutorial').BUSINESS_TUTORIALS, restaurant: () => load('database/pos-database'),
    async restart() { modules.clear(); const nextAuth = load('database/auth-database'); await nextAuth.getDatabase(); return load('database/business-database'); },
    close: () => sqlite.close() };
}
function offering(extra = {}) {
  return { name: 'Artículo', category: 'General', kind: 'product', sku: 'SKU-1', barcode: null,
    variant_label: '', unit: 'ml', price_minor: 100, stock_atoms: 100 * A, low_stock_atoms: A,
    lot_code: null, expires_at: null, rate_period: 'day', deposit_minor: 0,
    duration_minutes: 60, subscription_months: 1, digital_url: null, ...extra };
}
function sale(id, extra = {}) {
  return { operationKey: crypto.randomUUID(), customerName: 'Cliente', paymentMethod: 'Efectivo',
    receivedMinor: 10_000, lines: [{ offeringId: id, quantity: '5' }], ...extra };
}
function count(f, table) { return f.sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get().n; }
function checkIntegrity(f) {
  assert.deepEqual(f.sqlite.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(f.sqlite.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
}

test('fresh/v1/v3 bootstrap migrates to v4, rerun preserves data, future version rejected', async () => {
  for (const version of [0, 1, 3, 4]) {
    const f = await fixture(null, version);
    try {
      assert.equal(f.sqlite.prepare('PRAGMA user_version').get().user_version, 4);
      await f.business.selectBusiness({ name: 'Tienda', model: 'retail' });
      const reopened = await f.restart();
      assert.equal((await reopened.getBusinessProfile()).name, 'Tienda');
      assert.equal(count(f, 'business_profile'), 1);
      checkIntegrity(f);
    } finally { f.close(); }
  }
  await assert.rejects(() => fixture(null, 99), /más reciente/);
});
test('existing v3 restaurant records remain unchanged, including names previously treated as demo', async () => {
  const f = await fixture('restaurant', 3, 'web', (db) => {
    db.exec("INSERT INTO dishes(name,description,price,category,size,created_at,updated_at) VALUES('Mojito Clasico','Original',12000,'Bebidas','10oz',1,1)");
    db.exec("INSERT INTO inventory_items(name,unit,category,current_quantity,created_at,updated_at) VALUES('Ron blanco','lt','Insumos',2,1,1)");
  });
  try {
    const before = f.sqlite.prepare('SELECT id,name,price,size FROM dishes').all();
    await f.restart();
    assert.deepEqual(f.sqlite.prepare('SELECT id,name,price,size FROM dishes').all(), before);
    assert.equal(f.sqlite.prepare('SELECT current_quantity FROM inventory_items').get().current_quantity, 2);
    assert.equal(count(f, 'restaurant_preparation_tasks'), 0);
    const reference = fs.readFileSync(path.join(root, 'docs/architecture/multirubro-reference.sql'), 'utf8');
    const source = fs.readFileSync(path.join(root, 'database/business-schema.ts'), 'utf8');
    assert.ok(reference.includes(/export const BUSINESS_SCHEMA = `([\s\S]*?)`;/m.exec(source)[1]));
    checkIntegrity(f);
  } finally { f.close(); }
});
test('one business model persisted; restaurant data cannot be adopted as another model', async () => {
  const f = await fixture('measured');
  try {
    await assert.rejects(() => f.business.selectBusiness({ name: 'Cambio', model: 'retail' }), /mezclar/);
    assert.throws(() => f.sqlite.exec("UPDATE business_profile SET model='retail'"), /locked/);
    await assert.rejects(() => f.restaurant().getDishes(), /solo está disponible/);
    await assert.rejects(() => f.business.saveOffering(offering({ kind: 'asset' })), /no es válido/);
    assert.equal((await f.business.getBusinessProfile()).model, 'measured');
  } finally { f.close(); }
  const legacy = await fixture();
  try {
    legacy.sqlite.exec("INSERT INTO inventory_items(name,unit,category,created_at,updated_at) VALUES('Leche','lt','Insumos',1,1)");
    await assert.rejects(() => legacy.business.selectBusiness({ name: 'Tienda', model: 'retail' }), /restaurante/);
    await legacy.business.selectBusiness({ name: 'Café', model: 'restaurant' });
    assert.equal(count(legacy, 'inventory_items'), 1);
  } finally { legacy.close(); }
});
test('measured sale converts ml/litre, consumes exactly once, and cancellation preserves snapshot', async () => {
  const f = await fixture('measured');
  try {
    const id = await f.business.saveOffering(offering());
    const input = sale(id, { lines: [{ offeringId: id, quantity: '0,0125', unit: 'lt' }] });
    const order = await f.business.createBusinessSale(input);
    assert.equal(await f.business.createBusinessSale(input), order);
    let item = (await f.business.getOfferings())[0];
    assert.equal(item.stock_atoms, 87_500_000);
    assert.equal((await f.business.getBusinessOrderDetail(order)).order.total_minor, 1250);
    await f.business.saveOffering(offering({ id, price_minor: 999, stock_atoms: item.stock_atoms, name: 'Nuevo nombre' }));
    await f.business.cancelBusinessOrder(order, 'Producto devuelto');
    item = (await f.business.getOfferings())[0];
    assert.equal(item.stock_atoms, 100 * A);
    await assert.rejects(() => f.business.cancelBusinessOrder(order, 'Otra vez'), /cancelada/);
    assert.equal((await f.business.getBusinessOrderDetail(order)).lines[0].name_snapshot, 'Artículo');
    checkIntegrity(f);
  } finally { f.close(); }
});
test('insufficient aggregate demand / invalid precision / stale price writes nothing', async () => {
  const f = await fixture('measured');
  try {
    const id = await f.business.saveOffering(offering({ stock_atoms: 6 * A }));
    await assert.rejects(() => f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '4' }, { offeringId: id, quantity: '4' }] })), /stock insuficiente/);
    await assert.rejects(() => f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '0.0000001' }] })), /decimales/);
    await assert.rejects(() => f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '1', expectedPriceMinor: 99 }] })), /cambiaron/);
    assert.equal(count(f, 'business_orders'), 0);
    assert.equal((await f.business.getOfferings())[0].stock_atoms, 6 * A);
  } finally { f.close(); }
});
test('native unit of work enables FK before transaction', async () => {
  const f = await fixture('retail', 3, 'android');
  try {
    const id = await f.business.saveOffering(offering({ unit: 'und', stock_atoms: 2 * A }));
    await f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '1' }] }));
    assert.equal(f.sqlite.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    checkIntegrity(f);
  } finally { f.close(); }
});
test('retail validates whole pieces, unique SKU/barcode, expired lots and variant stock', async () => {
  const f = await fixture('retail');
  try {
    const id = await f.business.saveOffering(offering({ unit: 'und', barcode: '123', variant_label: 'M Azul', stock_atoms: 2 * A }));
    await assert.rejects(() => f.business.saveOffering(offering({ unit: 'und' })), /UNIQUE/);
    await assert.rejects(() => f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '1.5' }] })), /enteras/);
    await f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '1' }] }));
    assert.equal((await f.business.getOfferings())[0].stock_atoms, A);
    const expired = await f.business.saveOffering(offering({ sku: 'EXPIRED', name: 'Vencido', unit: 'und', expires_at: Date.now() - 1000 }));
    await assert.rejects(() => f.business.createBusinessSale(sale(expired, { lines: [{ offeringId: expired, quantity: '1' }] })), /vencido/);
    checkIntegrity(f);
  } finally { f.close(); }
});
test('rental overlaps rollback; adjacent bookings, delivery, return and deposits', async () => {
  const f = await fixture('rental');
  try {
    const id = await f.business.saveOffering(offering({ kind: 'asset', unit: 'und', price_minor: 1000, deposit_minor: 2000 }));
    const start = Date.now() + 86_400_000;
    const reserve = (from, to) => sale(id, { lines: [{ offeringId: id, quantity: '1', startsAt: from, endsAt: to }] });
    await f.business.createBusinessSale(reserve(start, start + 86_400_000));
    await assert.rejects(() => f.business.createBusinessSale(reserve(start + 1000, start + 86_400_000 + 1000)), /coincide/);
    assert.equal(count(f, 'business_orders'), 1);
    assert.equal(count(f, 'business_order_lines'), 1);
    await f.business.createBusinessSale(reserve(start + 86_400_000, start + 2 * 86_400_000));
    const b = (await f.business.getOperations()).bookings.find((row) => row.starts_at === start);
    await assert.rejects(() => f.business.setAssetCondition(id, 'maintenance'), /reservas activas/);
    await f.business.updateBooking(b.id, 'delivered');
    const second = (await f.business.getOperations()).bookings.find((row) => row.id !== b.id);
    await assert.rejects(() => f.business.updateBooking(second.id, 'delivered'), /no ha sido devuelto/);
    await assert.rejects(() => f.business.updateBooking(b.id, 'returned', 1500), /motivo/);
    await f.business.updateBooking(b.id, 'returned', 1500, 'Daño constatado');
    const row = (await f.business.getOperations()).bookings.find((row) => row.id === b.id);
    assert.equal(row.refunded_minor, 1500); assert.equal(row.retained_minor, 500);
    assert.equal((await f.business.getBusinessSummary()).all.revenue, 2000);
    assert.equal((await f.business.getOfferings())[0].stock_atoms, 0);
    checkIntegrity(f);
  } finally { f.close(); }
});
test('same staff cannot have overlapping appointments; different staff may', async () => {
  const f = await fixture('services');
  try {
    await f.business.addStaff('Ana'); await f.business.addStaff('Luis');
    const staff = await f.business.getStaff();
    const id = await f.business.saveOffering(offering({ kind: 'service', unit: 'und' }));
    const start = Date.now() + 86_400_000;
    const reserve = (staffId, startsAt) => sale(id, { lines: [{ offeringId: id, quantity: '1', staffId, startsAt }] });
    await f.business.createBusinessSale(reserve(staff[0].id, start));
    await assert.rejects(() => f.business.createBusinessSale(reserve(staff[0].id, start + 1000)), /coincide/);
    await f.business.createBusinessSale(reserve(staff[1].id, start));
    await f.business.createBusinessSale(reserve(staff[0].id, start + 3_600_000));
    assert.equal(count(f, 'business_orders'), 3);
    const booking = (await f.business.getOperations()).bookings[0];
    await f.business.updateBooking(booking.id, 'completed');
    const order = f.sqlite.prepare('SELECT order_id FROM business_order_lines WHERE id=(SELECT line_id FROM business_bookings WHERE id=?)').get(booking.id).order_id;
    await assert.rejects(() => f.business.cancelBusinessOrder(order, 'Ya realizado'), /ejecutada/);
    assert.equal(count(f, 'business_stock_movements'), 0);
    checkIntegrity(f);
  } finally { f.close(); }
});
test('digital delivery snapshot and subscription renewal are preserved and idempotent', async () => {
  const f = await fixture('services');
  try {
    const digital = await f.business.saveOffering(offering({ kind: 'digital', unit: 'und', digital_url: 'https://example.com/course' }));
    const order = await f.business.createBusinessSale(sale(digital, { lines: [{ offeringId: digital, quantity: '1' }] }));
    const access = (await f.business.getOperations()).accesses[0];
    assert.equal(access.url_snapshot, 'https://example.com/course');
    await f.business.updateAccess(access.id, 'delivered');
    await f.business.cancelBusinessOrder(order, 'Reembolso');
    assert.equal((await f.business.getOperations()).accesses[0].state, 'revoked');
    const plan = await f.business.saveOffering(offering({ name: 'Plan', sku: 'PLAN', kind: 'subscription', unit: 'und' }));
    await f.business.createBusinessSale(sale(plan, { lines: [{ offeringId: plan, quantity: '1' }] }));
    const due = Date.now() - 1000;
    f.sqlite.prepare('UPDATE business_subscriptions SET next_due_at=?').run(due);
    const subscription = (await f.business.getOperations()).subscriptions[0];
    const renewal = await f.business.renewSubscription(subscription.id, due, 'Efectivo');
    assert.equal(await f.business.renewSubscription(subscription.id, due, 'Efectivo'), renewal);
    assert.equal(count(f, 'business_subscription_cycles'), 1);
    await f.business.cancelSubscription(subscription.id);
    const changed = (await f.business.getOperations()).subscriptions[0];
    await assert.rejects(() => f.business.renewSubscription(changed.id, changed.next_due_at, 'Efectivo'), /cancelada/);
    checkIntegrity(f);
  } finally { f.close(); }
});
test('concurrent checkouts cannot oversell stock', async () => {
  const f = await fixture('retail');
  try {
    const id = await f.business.saveOffering(offering({ unit: 'und', stock_atoms: A }));
    const results = await Promise.allSettled([f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '1' }] })), f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '1' }] }))]);
    assert.equal(results.filter((row) => row.status === 'fulfilled').length, 1);
    assert.equal((await f.business.getOfferings())[0].stock_atoms, 0);
    assert.equal(count(f, 'business_orders'), 1);
  } finally { f.close(); }
});
test('restaurant aggregates ingredients, queues preparation and reverses original consumption', async () => {
  const f = await fixture('restaurant');
  try {
    const pos = f.restaurant();
    const inventory = await pos.createInventoryItem({ name: 'Leche', unit: 'lt', category: 'Insumos', currentQuantity: 10, lowStockThreshold: 1 });
    const dish = await pos.upsertDish({ name: 'Café', description: '', price: 1000, category: 'Bebidas', size: '8oz', recipeItems: [{ inventoryItemId: inventory, quantity: 4 }] });
    const input = { operationKey: crypto.randomUUID(), orderType: 'Para Llevar', deliveryFee: 0, paymentMethod: 'Efectivo', amountReceived: 10000, items: [{ dishId: dish, quantity: 2 }] };
    await assert.rejects(() => pos.createCompletedSale({ ...input, items: [{ dishId: dish, quantity: 2 }, { dishId: dish, quantity: 1 }] }), /stock insuficiente/);
    assert.equal(count(f, 'sales'), 0);
    const saleId = await pos.createCompletedSale(input);
    assert.equal(await pos.createCompletedSale(input), saleId);
    assert.equal(count(f, 'sales'), 1);
    assert.equal((await pos.getInventoryItemById(inventory)).currentQuantity, 2);
    assert.equal((await pos.getPreparationTasks()).length, 1);
    await pos.upsertDish({ id: dish, name: 'Café', description: '', price: 2000, category: 'Bebidas', size: '8oz', recipeItems: [{ inventoryItemId: inventory, quantity: 1 }] });
    await pos.cancelSale(saleId, 'Antes de preparar');
    assert.equal((await pos.getInventoryItemById(inventory)).currentQuantity, 10);
    await assert.rejects(() => pos.cancelSale(saleId, 'Otra vez'), /disponible/);
    const preparedSale = await pos.createCompletedSale({ ...input, operationKey: crypto.randomUUID() });
    await pos.advancePreparationTask((await pos.getPreparationTasks())[0].id);
    await pos.cancelSale(preparedSale, 'Preparación descartada');
    assert.equal((await pos.getInventoryItemById(inventory)).currentQuantity, 8);
    checkIntegrity(f);
  } finally { f.close(); }
});
test('exact decimal arithmetic, incompatible units and calendar month boundaries', async () => {
  const f = await fixture('measured');
  try {
    assert.equal(f.domain.moneyMinor('12,50'), 1250);
    assert.equal(f.domain.quantityAtoms('0.0125', 'lt'), 12_500_000);
    assert.equal(f.domain.lineAmount(12_500_000, 100000, A), 1250000);
    assert.equal(f.domain.lineAmount(1, 1, 2), 1);
    assert.throws(() => f.domain.moneyMinor('0.001'), /decimales/);
    assert.throws(() => f.domain.quantityAtoms('-1', 'ml'), /válido/);
    const id = await f.business.saveOffering(offering());
    await assert.rejects(() => f.business.createBusinessSale(sale(id, { lines: [{ offeringId: id, quantity: '1', unit: 'kg' }] })), /compatible/);
    const jan = new Date(2027, 0, 31, 10).getTime(), feb = new Date(2027, 1, 28, 10).getTime();
    assert.equal(f.domain.addCalendarMonths(jan, 1), feb);
    assert.equal(f.domain.rentalPeriods(jan, feb, 'month'), 1);
    assert.equal(f.domain.rentalPeriods(jan, feb + 1000, 'month'), 2);
    assert.throws(() => f.domain.parseLocalDate('2027-02-30 10:00'), /inválida/);
  } finally { f.close(); }
});


test('business tutorial is initially unseen, persists across restart, and stays scoped to its model', async () => {
  for (const model of ['restaurant', 'retail', 'measured', 'rental', 'services']) {
    const f = await fixture(model);
    try {
      assert.equal(await f.tutorial().hasSeenBusinessTutorial(model), false);
      const steps = f.tutorials()[model];
      assert.ok(steps.length >= 5 && steps.length <= 6);
      assert.equal(steps[0].target, 'settings');
      assert.equal(steps.at(-1).target, 'settings');
      assert.ok(steps.some((step) => step.target === 'menu'));
      assert.ok(steps.some((step) => step.target === 'sales'));
      if (model === 'services') {
        assert.ok(!steps.some((step) => step.target === 'inventory'));
        assert.ok(steps.findIndex((step) => step.target === 'operations') < steps.findIndex((step) => step.target === 'sales'));
      }
      if (model === 'restaurant') assert.ok(steps.findIndex((step) => step.target === 'inventory') < steps.findIndex((step) => step.target === 'menu'));
      await f.tutorial().markBusinessTutorialSeen(model);
      await f.tutorial().markBusinessTutorialSeen(model);
      await f.restart();
      assert.equal(await f.tutorial().hasSeenBusinessTutorial(model), true);
      const other = model === 'retail' ? 'restaurant' : 'retail';
      assert.equal(await f.tutorial().hasSeenBusinessTutorial(other), false);
      assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS count FROM settings WHERE key LIKE ?').get('business_tutorial_seen:%').count, 1);
      assert.equal((await f.business.getBusinessProfile()).model, model);
    } finally { f.close(); }
  }
});
