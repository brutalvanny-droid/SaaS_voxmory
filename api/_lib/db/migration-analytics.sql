-- Suivi d'audience : visiteurs et pages vues.
--
-- Script ré-exécutable : chaque instruction ne fait rien si elle a déjà
-- été appliquée. On peut donc le rejouer sans risque après une erreur.

CREATE TABLE IF NOT EXISTS visitors (
  anonymous_id     TEXT PRIMARY KEY,
  first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visits           INTEGER     NOT NULL DEFAULT 1,
  device           TEXT        NOT NULL DEFAULT 'desktop',
  country          TEXT,
  referrer_domain  TEXT
);

CREATE TABLE IF NOT EXISTS page_views (
  id                      TEXT PRIMARY KEY,
  anonymous_id            TEXT NOT NULL REFERENCES visitors(anonymous_id) ON DELETE CASCADE,
  path                    TEXT NOT NULL,
  referrer_domain         TEXT NOT NULL DEFAULT 'direct',
  device                  TEXT NOT NULL DEFAULT 'desktop',
  country                 TEXT,
  seconds_since_last_view INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Les requêtes du tableau de bord filtrent presque toujours par date :
-- sans ces index, chaque ouverture du studio relirait toute la table.
CREATE INDEX IF NOT EXISTS page_views_created_idx  ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx     ON page_views (path);
CREATE INDEX IF NOT EXISTS page_views_anon_idx     ON page_views (anonymous_id);
CREATE INDEX IF NOT EXISTS visitors_last_seen_idx  ON visitors (last_seen_at DESC);
