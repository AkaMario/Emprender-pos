// Additive runtime schema. Existing restaurant tables and IDs remain intact.
export const BUSINESS_SCHEMA = `
CREATE TABLE IF NOT EXISTS business_profile (
 id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL,
 model TEXT NOT NULL CHECK(model IN ('restaurant','rental','measured','retail','services')),
 created_at INTEGER NOT NULL
);
CREATE TRIGGER IF NOT EXISTS business_model_locked BEFORE UPDATE OF model ON business_profile
WHEN NEW.model <> OLD.model BEGIN SELECT RAISE(ABORT,'business model is locked'); END;
CREATE TRIGGER IF NOT EXISTS business_profile_no_delete BEFORE DELETE ON business_profile
BEGIN SELECT RAISE(ABORT,'business profile is linked to this database'); END;
CREATE TABLE IF NOT EXISTS business_offerings (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('product','packaging','asset','service','digital','subscription')),
 sku TEXT UNIQUE, barcode TEXT UNIQUE, variant_label TEXT NOT NULL DEFAULT '',
 unit TEXT NOT NULL CHECK(unit IN ('und','ml','lt','g','kg','m')),
 price_minor INTEGER NOT NULL CHECK(price_minor>=0), stock_atoms INTEGER NOT NULL DEFAULT 0 CHECK(stock_atoms>=0),
 low_stock_atoms INTEGER NOT NULL DEFAULT 0 CHECK(low_stock_atoms>=0),
 lot_code TEXT, expires_at INTEGER, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),
 condition TEXT NOT NULL DEFAULT 'usable' CHECK(condition IN ('usable','maintenance')),
 rate_period TEXT NOT NULL DEFAULT 'day' CHECK(rate_period IN ('hour','day','month')),
 deposit_minor INTEGER NOT NULL DEFAULT 0 CHECK(deposit_minor>=0),
 duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK(duration_minutes>0),
 subscription_months INTEGER NOT NULL DEFAULT 1 CHECK(subscription_months>0),
 digital_url TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS business_orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT, operation_key TEXT NOT NULL UNIQUE,
 customer_name TEXT NOT NULL, model TEXT NOT NULL CHECK(model IN ('rental','measured','retail','services')), payment_method TEXT NOT NULL CHECK(payment_method IN ('Efectivo','Transferencia')),
 total_minor INTEGER NOT NULL CHECK(total_minor>=0), deposit_minor INTEGER NOT NULL DEFAULT 0 CHECK(deposit_minor>=0),
 amount_received_minor INTEGER NOT NULL CHECK(amount_received_minor>=0),
 status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','cancelled')),
 created_at INTEGER NOT NULL, cancellation_reason TEXT
);
CREATE TABLE IF NOT EXISTS business_order_lines (
 id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES business_orders(id),
 offering_id INTEGER NOT NULL REFERENCES business_offerings(id), name_snapshot TEXT NOT NULL,
 category_snapshot TEXT NOT NULL, unit_snapshot TEXT NOT NULL,
 quantity_atoms INTEGER NOT NULL CHECK(quantity_atoms>0), price_minor INTEGER NOT NULL CHECK(price_minor>=0),
 price_basis_atoms INTEGER NOT NULL CHECK(price_basis_atoms>0), total_minor INTEGER NOT NULL CHECK(total_minor>=0)
);
CREATE TABLE IF NOT EXISTS business_stock_movements (
 id INTEGER PRIMARY KEY AUTOINCREMENT, offering_id INTEGER NOT NULL REFERENCES business_offerings(id),
 order_id INTEGER REFERENCES business_orders(id), delta_atoms INTEGER NOT NULL CHECK(delta_atoms<>0),
 reason TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS business_staff (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1))
);
CREATE TABLE IF NOT EXISTS business_bookings (
 id INTEGER PRIMARY KEY AUTOINCREMENT, line_id INTEGER NOT NULL UNIQUE REFERENCES business_order_lines(id),
 offering_id INTEGER NOT NULL REFERENCES business_offerings(id), staff_id INTEGER REFERENCES business_staff(id),
 starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL CHECK(ends_at>starts_at),
 state TEXT NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','delivered','returned','completed','cancelled')),
 deposit_minor INTEGER NOT NULL DEFAULT 0, refunded_minor INTEGER NOT NULL DEFAULT 0,
 retained_minor INTEGER NOT NULL DEFAULT 0, inspection_notes TEXT,
 CHECK(deposit_minor>=0 AND refunded_minor>=0 AND retained_minor>=0 AND refunded_minor+retained_minor<=deposit_minor)
);
CREATE TRIGGER IF NOT EXISTS business_booking_insert BEFORE INSERT ON business_bookings
WHEN NEW.state IN ('reserved','delivered') AND EXISTS (
 SELECT 1 FROM business_bookings b WHERE b.state IN ('reserved','delivered')
 AND ((NEW.staff_id IS NULL AND b.staff_id IS NULL AND b.offering_id=NEW.offering_id) OR b.staff_id=NEW.staff_id)
 AND b.starts_at<NEW.ends_at AND NEW.starts_at<b.ends_at
) BEGIN SELECT RAISE(ABORT,'La reserva coincide con otra ocupación.'); END;
CREATE TRIGGER IF NOT EXISTS business_booking_update BEFORE UPDATE ON business_bookings
WHEN NEW.state IN ('reserved','delivered') AND EXISTS (
 SELECT 1 FROM business_bookings b WHERE b.id<>NEW.id AND b.state IN ('reserved','delivered')
 AND ((NEW.staff_id IS NULL AND b.staff_id IS NULL AND b.offering_id=NEW.offering_id) OR b.staff_id=NEW.staff_id)
 AND b.starts_at<NEW.ends_at AND NEW.starts_at<b.ends_at
) BEGIN SELECT RAISE(ABORT,'La reserva coincide con otra ocupación.'); END;
CREATE TABLE IF NOT EXISTS business_accesses (
 id INTEGER PRIMARY KEY AUTOINCREMENT, line_id INTEGER NOT NULL UNIQUE REFERENCES business_order_lines(id),
 access_code TEXT NOT NULL UNIQUE, url_snapshot TEXT,
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','delivered','revoked'))
);
CREATE TABLE IF NOT EXISTS business_subscriptions (
 id INTEGER PRIMARY KEY AUTOINCREMENT, offering_id INTEGER NOT NULL REFERENCES business_offerings(id),
 initial_line_id INTEGER NOT NULL UNIQUE REFERENCES business_order_lines(id), customer_name TEXT NOT NULL,
 price_minor INTEGER NOT NULL CHECK(price_minor>=0), months INTEGER NOT NULL CHECK(months>0),
 next_due_at INTEGER NOT NULL, state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','cancelled'))
);
CREATE TABLE IF NOT EXISTS business_subscription_cycles (
 subscription_id INTEGER NOT NULL REFERENCES business_subscriptions(id),
 due_at INTEGER NOT NULL, order_id INTEGER NOT NULL UNIQUE REFERENCES business_orders(id),
 PRIMARY KEY(subscription_id,due_at)
);
CREATE TABLE IF NOT EXISTS restaurant_preparation_tasks (
 id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER NOT NULL REFERENCES sales(id),
 dish_name_snapshot TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0),
 state TEXT NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','preparing','ready','served','cancelled')),
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS restaurant_checkout_keys (
 operation_key TEXT PRIMARY KEY NOT NULL, sale_id INTEGER NOT NULL UNIQUE REFERENCES sales(id)
);
CREATE INDEX IF NOT EXISTS business_orders_date ON business_orders(created_at);
CREATE INDEX IF NOT EXISTS business_booking_dates ON business_bookings(starts_at,ends_at);
CREATE INDEX IF NOT EXISTS business_lines_order ON business_order_lines(order_id);
CREATE TRIGGER IF NOT EXISTS business_order_model BEFORE INSERT ON business_orders
WHEN NEW.model IS NOT (SELECT model FROM business_profile WHERE id=1)
BEGIN SELECT RAISE(ABORT,'El pedido no pertenece al tipo de emprendimiento seleccionado.'); END;
CREATE TRIGGER IF NOT EXISTS business_offering_model BEFORE INSERT ON business_offerings
WHEN NOT EXISTS (SELECT 1 FROM business_profile p WHERE
 (p.model='measured' AND NEW.kind IN ('product','packaging')) OR
 (p.model='retail' AND NEW.kind='product') OR (p.model='rental' AND NEW.kind='asset') OR
 (p.model='services' AND NEW.kind IN ('service','digital','subscription')))
BEGIN SELECT RAISE(ABORT,'El artículo no pertenece al tipo de emprendimiento seleccionado.'); END;
`;
