export type EventKind = "feed" | "diaper" | "sleep";

export interface EventRow {
  id: number;
  kind: EventKind;
  start_ts: number;
  end_ts: number | null;
  details: string | null;
  created_at: number;
  source: string | null;
}

export interface EventDetails {
  side?: "left" | "right" | "bottle";
  bottle_oz?: number;
  diaper_type?: "pee" | "poop" | "both";
  note?: string;
}

export async function insertEvent(
  db: D1Database,
  kind: EventKind,
  startTs: number,
  endTs: number | null,
  details: EventDetails,
  source: string,
): Promise<number> {
  const result = await db
    .prepare(
      "INSERT INTO events (kind, start_ts, end_ts, details, created_at, source) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(kind, startTs, endTs, JSON.stringify(details), Date.now(), source)
    .run();
  return result.meta.last_row_id as number;
}

export async function findOpenEvent(
  db: D1Database,
  kind: EventKind,
): Promise<EventRow | null> {
  const row = await db
    .prepare(
      "SELECT * FROM events WHERE kind = ? AND end_ts IS NULL ORDER BY start_ts DESC LIMIT 1",
    )
    .bind(kind)
    .first<EventRow>();
  return row ?? null;
}

export async function closeEvent(
  db: D1Database,
  id: number,
  endTs: number,
): Promise<void> {
  await db
    .prepare("UPDATE events SET end_ts = ? WHERE id = ?")
    .bind(endTs, id)
    .run();
}

export async function recentEvents(
  db: D1Database,
  sinceTs: number,
): Promise<EventRow[]> {
  const result = await db
    .prepare(
      "SELECT * FROM events WHERE start_ts >= ? ORDER BY start_ts DESC LIMIT 500",
    )
    .bind(sinceTs)
    .all<EventRow>();
  return result.results;
}

export async function deleteEvent(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
}

export async function updateEvent(
  db: D1Database,
  id: number,
  patch: { start_ts?: number; end_ts?: number | null; details?: EventDetails },
): Promise<void> {
  const fields: string[] = [];
  const values: (number | string | null)[] = [];
  if (patch.start_ts !== undefined) {
    fields.push("start_ts = ?");
    values.push(patch.start_ts);
  }
  if (patch.end_ts !== undefined) {
    fields.push("end_ts = ?");
    values.push(patch.end_ts);
  }
  if (patch.details !== undefined) {
    fields.push("details = ?");
    values.push(JSON.stringify(patch.details));
  }
  if (fields.length === 0) return;
  values.push(id);
  await db
    .prepare(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}
