import {
  insertEvent,
  findOpenEvent,
  closeEvent,
  recentEvents,
  deleteEvent,
  updateEvent,
  type EventDetails,
} from "./db";
import {
  parseCommand,
  parseWithLLM,
  offsetMsFromMinutes,
  describeForSiri,
  type Parsed,
} from "./parse";
import { DASHBOARD_HTML } from "./dashboard";

export interface Env {
  DB: D1Database;
  SHARED_TOKEN: string;
  ANTHROPIC_API_KEY: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function requireToken(req: Request, env: Env): Response | null {
  const token = req.headers.get("X-Token");
  if (!token || token !== env.SHARED_TOKEN) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  return null;
}

async function handleLog(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const input = (body.text ?? "").trim();
  if (!input) return json({ ok: false, error: "empty input" }, 400);

  let parsed: Parsed | null = parseCommand(input);
  if (!parsed) {
    const llmResult = await parseWithLLM(input, env.ANTHROPIC_API_KEY);
    if ("error" in llmResult) {
      return json({ ok: false, error: `could not parse: ${llmResult.error}` }, 400);
    }
    parsed = llmResult;
  }

  const now = Date.now();

  if (parsed.kind === "diaper") {
    const ts = now + offsetMsFromMinutes(parsed.start_ts_offset_min);
    const details: EventDetails = { diaper_type: parsed.diaper_type };
    const id = await insertEvent(env.DB, "diaper", ts, ts, details, "shortcut");
    return json({
      ok: true,
      id,
      message: describeForSiri("diaper", details, ts),
    });
  }

  if (parsed.kind === "feed" && parsed.action === "start") {
    const open = await findOpenEvent(env.DB, "feed");
    if (open) {
      return json({
        ok: true,
        message: `A feed is already in progress (started ${new Date(open.start_ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}). Say "done" to end it.`,
      });
    }
    const ts = now + offsetMsFromMinutes(parsed.start_ts_offset_min);
    const details: EventDetails = { side: parsed.side };
    if (parsed.bottle_oz !== undefined) details.bottle_oz = parsed.bottle_oz;
    const id = await insertEvent(env.DB, "feed", ts, null, details, "shortcut");
    return json({
      ok: true,
      id,
      message: describeForSiri("feed", details, ts, "start"),
    });
  }

  if (parsed.kind === "feed" && parsed.action === "end") {
    const open = await findOpenEvent(env.DB, "feed");
    if (!open) {
      return json({ ok: true, message: "No open feed to end." });
    }
    const endTs = now + offsetMsFromMinutes(parsed.end_ts_offset_min);
    await closeEvent(env.DB, open.id, endTs);
    const details: EventDetails = open.details ? JSON.parse(open.details) : {};
    return json({
      ok: true,
      id: open.id,
      message: describeForSiri("feed", details, endTs, "end"),
    });
  }

  if (parsed.kind === "sleep" && parsed.action === "start") {
    const open = await findOpenEvent(env.DB, "sleep");
    if (open) {
      return json({ ok: true, message: "Sleep already in progress." });
    }
    const ts = now + offsetMsFromMinutes(parsed.start_ts_offset_min);
    const id = await insertEvent(env.DB, "sleep", ts, null, {}, "shortcut");
    return json({
      ok: true,
      id,
      message: describeForSiri("sleep", {}, ts, "start"),
    });
  }

  if (parsed.kind === "sleep" && parsed.action === "end") {
    const open = await findOpenEvent(env.DB, "sleep");
    if (!open) {
      return json({ ok: true, message: "No open sleep to end." });
    }
    const endTs = now + offsetMsFromMinutes(parsed.end_ts_offset_min);
    await closeEvent(env.DB, open.id, endTs);
    return json({
      ok: true,
      id: open.id,
      message: describeForSiri("sleep", {}, endTs, "end"),
    });
  }

  return json({ ok: false, error: "unhandled parse result" }, 500);
}

async function handleListEvents(env: Env): Promise<Response> {
  const sinceTs = Date.now() - 48 * 60 * 60 * 1000;
  const events = await recentEvents(env.DB, sinceTs);
  return json({ events });
}

async function handleEventMutate(
  req: Request,
  env: Env,
  id: number,
): Promise<Response> {
  if (req.method === "DELETE") {
    await deleteEvent(env.DB, id);
    return json({ ok: true });
  }
  if (req.method === "POST") {
    const body = (await req.json().catch(() => ({}))) as {
      start_ts?: number;
      end_ts?: number | null;
      details?: EventDetails;
    };
    await updateEvent(env.DB, id, body);
    return json({ ok: true });
  }
  return json({ ok: false, error: "method not allowed" }, 405);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/" || url.pathname === "/dashboard") {
      return new Response(DASHBOARD_HTML, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    const authFail = requireToken(req, env);
    if (authFail) return authFail;

    if (url.pathname === "/log" && req.method === "POST") {
      try {
        return await handleLog(req, env);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return json({ ok: false, error: msg }, 500);
      }
    }

    if (url.pathname === "/api/events" && req.method === "GET") {
      return handleListEvents(env);
    }

    const eventMatch = url.pathname.match(/^\/api\/events\/(\d+)$/);
    if (eventMatch) {
      const id = parseInt(eventMatch[1], 10);
      return handleEventMutate(req, env, id);
    }

    return json({ ok: false, error: "not found" }, 404);
  },
};
