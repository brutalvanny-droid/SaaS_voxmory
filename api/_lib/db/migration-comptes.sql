-- ============================================================
--   VOXMORY — Comptes clients
--   À exécuter une seule fois sur la base de production.
-- ============================================================

-- Table des comptes clients.
CREATE TABLE IF NOT EXISTS users (
  id                     text PRIMARY KEY,
  email                  text        NOT NULL,
  password_hash          text        NOT NULL,
  name                   text        NOT NULL,
  phone                  text,
  city                   text,
  country                text,
  is_active              boolean     NOT NULL DEFAULT true,
  reset_token            text,
  reset_token_expires_at timestamptz,
  last_login_at          timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Une seule adresse par compte : c'est la clé de reconnaissance
-- des commandes passées en invité.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
CREATE INDEX IF NOT EXISTS users_created_idx ON users (created_at);

-- Rattachement des commandes aux comptes.
-- La colonne reste vide pour les commandes passées sans inscription.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id text REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_user_idx  ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (customer_email);
