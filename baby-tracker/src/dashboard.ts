export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Baby Tracker</title>
<style>
  :root {
    --bg: #fafaf7;
    --card: #fff;
    --ink: #222;
    --muted: #888;
    --border: #e8e6e0;
    --accent: #c77d5a;
    --pee: #f2d066;
    --poop: #9b7050;
    --both: #b89060;
    --feed: #7a9c74;
    --sleep: #6b8fb5;
    --open: #d85555;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1a1a18;
      --card: #252522;
      --ink: #eee;
      --muted: #888;
      --border: #333330;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font: 16px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--ink);
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
  header { padding: 16px; display: flex; justify-content: space-between; align-items: baseline; }
  h1 { font-size: 22px; margin: 0; font-weight: 600; }
  .refresh { background: none; border: none; color: var(--muted); font-size: 14px; cursor: pointer; }
  main { padding: 0 16px 80px; max-width: 560px; margin: 0 auto; }

  .totals {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;
  }
  .total {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 12px; text-align: center;
  }
  .total .num { font-size: 22px; font-weight: 600; }
  .total .label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }

  .in-progress {
    background: var(--open); color: #fff; padding: 12px 16px; border-radius: 10px;
    margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;
  }
  .in-progress button {
    background: rgba(255,255,255,0.25); color: #fff; border: 1px solid rgba(255,255,255,0.5);
    padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer;
  }

  .day-header {
    font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em;
    margin: 16px 0 8px; font-weight: 600;
  }
  .event {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 12px;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .dot.pee { background: var(--pee); }
  .dot.poop { background: var(--poop); }
  .dot.both { background: var(--both); }
  .dot.feed { background: var(--feed); }
  .dot.sleep { background: var(--sleep); }
  .dot.open { background: var(--open); }
  .event .label { flex: 1; font-size: 15px; }
  .event .time { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
  .event .dur { color: var(--muted); font-size: 12px; margin-left: 8px; }
  .event button.del {
    background: none; border: none; color: var(--muted); font-size: 16px;
    padding: 0 4px; cursor: pointer; opacity: 0.4;
  }
  .event button.del:hover { opacity: 1; color: var(--open); }

  .empty { color: var(--muted); text-align: center; padding: 40px 16px; }
  .token-prompt {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 20px; margin: 40px auto; max-width: 320px;
  }
  .token-prompt input {
    width: 100%; padding: 10px; font-size: 16px; border: 1px solid var(--border);
    border-radius: 6px; background: var(--bg); color: var(--ink);
  }
  .token-prompt button {
    width: 100%; margin-top: 10px; padding: 10px; background: var(--accent);
    color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;
  }
</style>
</head>
<body>
<header>
  <h1>Baby</h1>
  <button class="refresh" onclick="load()">refresh</button>
</header>
<main id="main">
  <div class="empty">loading\u2026</div>
</main>
<script>
const TOKEN_KEY = "baby-tracker-token";
let token = localStorage.getItem(TOKEN_KEY) || "";

function promptToken() {
  document.getElementById("main").innerHTML =
    '<div class="token-prompt"><div style="margin-bottom:10px">Enter family token:</div>' +
    '<input id="tok" type="password" autocomplete="off"><button onclick="saveToken()">save</button></div>';
}
function saveToken() {
  const val = document.getElementById("tok").value.trim();
  if (!val) return;
  token = val;
  localStorage.setItem(TOKEN_KEY, val);
  load();
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDur(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return mins + "m";
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? h + "h" : h + "h " + m + "m";
}
function dayKey(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
function isToday(ts) {
  const d = new Date(ts), now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function labelFor(ev) {
  const d = ev.details ? JSON.parse(ev.details) : {};
  if (ev.kind === "diaper") return "diaper \u00b7 " + (d.diaper_type || "");
  if (ev.kind === "feed") {
    const side = d.side || "feed";
    const oz = d.bottle_oz ? " (" + d.bottle_oz + " oz)" : "";
    return side + " feed" + oz;
  }
  if (ev.kind === "sleep") return "sleep";
  return ev.kind;
}

async function api(path, opts) {
  const res = await fetch(path, Object.assign({
    headers: { "X-Token": token, "content-type": "application/json" }
  }, opts || {}));
  if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); token = ""; promptToken(); throw new Error("unauthorized"); }
  return res;
}

async function load() {
  if (!token) { promptToken(); return; }
  let events;
  try {
    const r = await api("/api/events");
    if (!r.ok) throw new Error("load failed");
    events = (await r.json()).events;
  } catch (e) {
    document.getElementById("main").innerHTML = '<div class="empty">error: ' + e.message + '</div>';
    return;
  }

  const todays = events.filter(e => isToday(e.start_ts));
  const feedCount = todays.filter(e => e.kind === "feed").length;
  const feedOz = todays
    .filter(e => e.kind === "feed")
    .reduce((s, e) => s + ((e.details && JSON.parse(e.details).bottle_oz) || 0), 0);
  const diaperCount = todays.filter(e => e.kind === "diaper").length;
  const sleepMs = todays
    .filter(e => e.kind === "sleep" && e.end_ts)
    .reduce((s, e) => s + (e.end_ts - e.start_ts), 0);

  let html = '<div class="totals">' +
    '<div class="total"><div class="num">' + feedCount + '</div><div class="label">feeds' + (feedOz ? ' \u00b7 ' + feedOz + 'oz' : '') + '</div></div>' +
    '<div class="total"><div class="num">' + diaperCount + '</div><div class="label">diapers</div></div>' +
    '<div class="total"><div class="num">' + (sleepMs ? fmtDur(sleepMs) : "0m") + '</div><div class="label">sleep</div></div>' +
    '</div>';

  const openEvent = events.find(e => e.end_ts === null);
  if (openEvent) {
    html += '<div class="in-progress"><div>' + labelFor(openEvent) + ' \u00b7 started ' + fmtTime(openEvent.start_ts) + '</div>' +
      '<button onclick="endEvent(' + openEvent.id + ')">End</button></div>';
  }

  if (events.length === 0) {
    html += '<div class="empty">no events yet</div>';
  } else {
    let currentDay = "";
    for (const ev of events) {
      const k = dayKey(ev.start_ts);
      if (k !== currentDay) {
        html += '<div class="day-header">' + (isToday(ev.start_ts) ? "Today" : k) + '</div>';
        currentDay = k;
      }
      const d = ev.details ? JSON.parse(ev.details) : {};
      const dotClass = ev.kind === "diaper" ? (d.diaper_type || "pee") : ev.kind;
      const openClass = ev.end_ts === null ? " open" : "";
      const dur = ev.end_ts ? '<span class="dur">' + fmtDur(ev.end_ts - ev.start_ts) + '</span>' : '';
      html += '<div class="event">' +
        '<div class="dot ' + dotClass + openClass + '"></div>' +
        '<div class="label">' + labelFor(ev) + dur + '</div>' +
        '<div class="time">' + fmtTime(ev.start_ts) + '</div>' +
        '<button class="del" onclick="deleteEvent(' + ev.id + ')" title="delete">\u00d7</button>' +
        '</div>';
    }
  }
  document.getElementById("main").innerHTML = html;
}

async function endEvent(id) {
  await api("/api/events/" + id, {
    method: "POST",
    body: JSON.stringify({ end_ts: Date.now() })
  });
  load();
}

async function deleteEvent(id) {
  if (!confirm("Delete this event?")) return;
  await api("/api/events/" + id, { method: "DELETE" });
  load();
}

load();
setInterval(() => { if (token) load(); }, 30000);
</script>
</body>
</html>`;
