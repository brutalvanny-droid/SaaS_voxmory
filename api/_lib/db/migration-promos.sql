-- ============================================================
--   VOXMORY — Codes promo
--   À exécuter une seule fois sur la base de production.
--   Le script est idempotent : le relancer ne casse rien.
-- ============================================================

-- ------------------------------------------------------------
--  1. Codes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
  id                text PRIMARY KEY,
  code              text        NOT NULL,
  label             text        NOT NULL DEFAULT '',
  package_id        text        REFERENCES packages (id) ON DELETE CASCADE,
  discount_type     text        NOT NULL DEFAULT 'percent',
  percent_off       integer     NOT NULL DEFAULT 0,
  include_vip_fee   boolean     NOT NULL DEFAULT false,
  used_count        integer     NOT NULL DEFAULT 0,
  starts_at         timestamptz,
  expires_at        timestamptz,
  is_active         boolean     NOT NULL DEFAULT true,
  note              text,
  created_by        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_unique ON promo_codes USING btree (code);
CREATE INDEX IF NOT EXISTS promo_codes_package_idx ON promo_codes USING btree (package_id);
CREATE INDEX IF NOT EXISTS promo_codes_active_idx ON promo_codes USING btree (is_active);
CREATE INDEX IF NOT EXISTS promo_codes_created_idx ON promo_codes USING btree (created_at);

-- ------------------------------------------------------------
--  2. Traces d'utilisation
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id              text PRIMARY KEY,
  promo_id        text        NOT NULL REFERENCES promo_codes (id) ON DELETE CASCADE,
  order_id        text        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  customer_phone  text        NOT NULL DEFAULT '',
  customer_email  text,
  base_cents      integer     NOT NULL DEFAULT 0,
  discount_cents  integer     NOT NULL DEFAULT 0,
  final_cents     integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS promo_redemptions_order_unique ON promo_redemptions USING btree (order_id);
CREATE INDEX IF NOT EXISTS promo_redemptions_promo_idx ON promo_redemptions USING btree (promo_id);
CREATE INDEX IF NOT EXISTS promo_redemptions_phone_idx ON promo_redemptions USING btree (customer_phone);

-- ------------------------------------------------------------
--  3. Colonnes sur les commandes
-- ------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code     text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_id       text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;
