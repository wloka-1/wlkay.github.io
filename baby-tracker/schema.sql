CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT NOT NULL,
  start_ts    INTEGER NOT NULL,
  end_ts      INTEGER,
  details     TEXT,
  created_at  INTEGER NOT NULL,
  source      TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_kind_start ON events(kind, start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_ts DESC);
