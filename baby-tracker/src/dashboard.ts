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
    --med: #a06ab4;
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

  .text-input {
    display: flex; gap: 8px; margin-bottom: 6px;
  }
  .text-input input {
    flex: 1; padding: 12px; font-size: 16px; border: 1px solid var(--border);
    border-radius: 10px; background: var(--card); color: var(--ink);
  }
  .text-input button {
    padding: 0 16px; background: var(--accent); color: #fff; border: none;
    border-radius: 10px; font-weight: 600; cursor: pointer;
  }
  .hint { font-size: 11px; color: var(--muted); text-align: center; margin-bottom: 16px; }

  .totals {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;
  }
  .total {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 12px; text-align: center;
  }
  .total .num { font-size: 22px; font-weight: 600; }
  .total .label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }

  .quick-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;
  }
  .qbtn {
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 12px 4px; text-align: center; cursor: pointer; color: var(--ink);
    font-size: 12px; font-weight: 500; -webkit-tap-highlight-color: transparent;
  }
  .qbtn:active { background: var(--border); }
  .qbtn .emoji { font-size: 20px; display: block; margin-bottom: 2px; line-height: 1; }
  .qbtn[disabled] { opacity: 0.3; pointer-events: none; }

  .meds-section {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 12px; margin-bottom: 16px;
  }
  .meds-title {
    font-size: 11px; color: var(--muted); text-transform: uppercase;
    letter-spacing: 0.06em; font-weight: 600; margin-bottom: 6px;
  }
  .med-row {
    display: flex; align-items: center; gap: 10px; padding: 8px 0;
    border-top: 1px solid var(--border);
  }
  .med-row:first-of-type { border-top: none; padding-top: 4px; }
  .med-info { flex: 1; }
  .med-info .name { font-size: 14px; font-weight: 500; }
  .med-info .sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .med-info .due-now { color: var(--open); font-weight: 600; }
  .med-btn {
    background: var(--med); color: #fff; border: none; border-radius: 8px;
    padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
    white-space: nowrap;
  }
  .med-btn:active { opacity: 0.8; }

  .in-progress {
    background: var(--open); color: #fff; padding: 12px 16px; border-radius: 10px;
    margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;
  }
  .in-progress button {
    background: rgba(255,255,255,0.25); color: #fff; border: 1px solid rgba(255,255,255,0.5);
    padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer;
  }

  .view-toggle {
    display: flex; gap: 4px; background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; padding: 4px; margin-bottom: 12px;
  }
  .view-toggle button {
    flex: 1; background: none; border: none; color: var(--muted);
    padding: 8px; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500;
  }
  .view-toggle button.active { background: var(--accent); color: #fff; }

  .day-header {
    font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em;
    margin: 16px 0 8px; font-weight: 600;
  }
  .event {
    background: var(--card); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 12px;
    cursor: pointer;
  }
  .event:active { background: var(--border); }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .dot.pee { background: var(--pee); }
  .dot.poop { background: var(--poop); }
  .dot.both { background: var(--both); }
  .dot.feed { background: var(--feed); }
  .dot.sleep { background: var(--sleep); }
  .dot.med { background: var(--med); }
  .dot.open { background: var(--open); }
  .event .label { flex: 1; font-size: 15px; }
  .event .time { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
  .event .dur { color: var(--muted); font-size: 12px; margin-left: 8px; }

  .cal-day { margin-bottom: 18px; }
  .cal-day-label { font-size: 12px; color: var(--muted); margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .cal-track {
    position: relative; height: 44px;
    background: var(--card); border: 1px solid var(--border); border-radius: 8px;
    overflow: hidden;
  }
  .cal-hour {
    position: absolute; top: 0; bottom: 0; width: 1px; background: var(--border);
  }
  .cal-hour-label {
    position: absolute; top: 2px; font-size: 9px; color: var(--muted); transform: translateX(-50%);
  }
  .cal-block {
    position: absolute; top: 14px; bottom: 4px; border-radius: 3px; min-width: 2px;
    cursor: pointer;
  }
  .cal-block.feed { background: var(--feed); }
  .cal-block.sleep { background: var(--sleep); }
  .cal-block.feed.open, .cal-block.sleep.open { opacity: 0.5; }
  .cal-dot {
    position: absolute; top: 18px; width: 9px; height: 9px; border-radius: 50%;
    transform: translateX(-50%); cursor: pointer; border: 1px solid var(--card);
  }
  .cal-dot.pee { background: var(--pee); }
  .cal-dot.poop { background: var(--poop); }
  .cal-dot.both { background: var(--both); }
  .cal-dot.med { background: var(--med); }

  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 20;
    display: none; align-items: center; justify-content: center;
  }
  .modal-backdrop.show { display: flex; }
  .modal {
    background: var(--card); border-radius: 14px; padding: 20px;
    width: calc(100% - 32px); max-width: 400px;
  }
  .modal h2 { margin: 0 0 16px; font-size: 18px; }
  .modal-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .modal-row label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .modal-row input, .modal-row select {
    padding: 10px; font-size: 16px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--bg); color: var(--ink); width: 100%;
  }
  .modal-actions { display: flex; gap: 8px; margin-top: 20px; }
  .modal-actions button {
    flex: 1; padding: 10px; border: none; border-radius: 8px; font-weight: 600;
    font-size: 15px; cursor: pointer;
  }
  .btn-save { background: var(--accent); color: #fff; }
  .btn-cancel { background: var(--border); color: var(--ink); }
  .btn-delete { background: var(--open); color: #fff; }

  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: var(--ink); color: var(--bg); padding: 10px 16px; border-radius: 8px;
    font-size: 14px; opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 30;
    max-width: calc(100vw - 32px); text-align: center;
  }
  .toast.show { opacity: 0.92; }

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
<main>
  <div id="shell"></div>
</main>
<div id="modal" class="modal-backdrop" onclick="if(event.target===this)closeModal()"></div>
<div id="toast" class="toast"></div>
<script>
const TOKEN_KEY = "baby-tracker-token";
let token = localStorage.getItem(TOKEN_KEY) || "";
let currentView = localStorage.getItem("baby-view") || "list";
let currentEvents = [];

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2400);
}

function promptToken() {
  document.getElementById("shell").innerHTML =
    '<div class="token-prompt"><div style="margin-bottom:10px">Enter family token:</div>' +
    '<input id="tok" type="password" autocomplete="off"><button onclick="saveToken()">save</button></div>';
}
function saveToken() {
  const val = document.getElementById("tok").value.trim();
  if (!val) return;
  token = val;
  localStorage.setItem(TOKEN_KEY, val);
  renderShell();
  load();
}

function renderShell() {
  document.getElementById("shell").innerHTML = \`
    <div class="text-input">
      <input id="freetext" type="text" placeholder="type or dictate, e.g. 'she just pooped'"
             autocomplete="off" autocapitalize="none">
      <button onclick="submitText()">log</button>
    </div>
    <div class="hint">tap the \u{1F3A4} mic key on your keyboard to dictate</div>
    <div id="quick-container"></div>
    <div id="meds-container"></div>
    <div id="in-progress-container"></div>
    <div class="view-toggle">
      <button id="v-list" onclick="setView('list')">list</button>
      <button id="v-cal" onclick="setView('calendar')">calendar</button>
    </div>
    <div id="events-container"></div>
  \`;
  document.getElementById("freetext").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitText();
  });
  document.getElementById("v-" + (currentView === "calendar" ? "cal" : "list")).classList.add("active");
}

function setView(v) {
  currentView = v;
  localStorage.setItem("baby-view", v);
  document.getElementById("v-list").classList.toggle("active", v === "list");
  document.getElementById("v-cal").classList.toggle("active", v === "calendar");
  renderEvents();
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
function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function tsToLocalInput(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
    "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
}
function localInputToTs(str) {
  return new Date(str).getTime();
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
  if (ev.kind === "med") {
    const dose = d.dose_mg ? " " + d.dose_mg + "mg" : "";
    return (d.med_name || "med") + dose;
  }
  return ev.kind;
}

function fmtMinsAway(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return mins + " min";
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? h + "h" : h + "h " + m + "m";
}

function findLastMed(name) {
  for (const ev of currentEvents) {
    if (ev.kind !== "med") continue;
    const d = ev.details ? JSON.parse(ev.details) : {};
    if (d.med_name === name) return ev;
  }
  return null;
}

const MED_INTERVAL_MS = 6 * 60 * 60 * 1000;

function renderMeds() {
  const container = document.getElementById("meds-container");
  if (!container) return;
  const now = Date.now();

  const scheduled = (name, label, dose) => {
    const last = findLastMed(name);
    let sub;
    if (!last) {
      sub = '<span class="sub">no doses logged yet</span>';
    } else {
      const nextTs = last.start_ts + MED_INTERVAL_MS;
      if (nextTs <= now) {
        sub = '<span class="sub due-now">due now</span> <span class="sub">· last ' + fmtTime(last.start_ts) + '</span>';
      } else {
        sub = '<span class="sub">next ' + fmtTime(nextTs) + ' · in ' + fmtMinsAway(nextTs - now) + '</span>';
      }
    }
    return '<div class="med-row">' +
      '<div class="med-info"><div class="name">' + label + ' ' + dose + 'mg</div>' + sub + '</div>' +
      '<button class="med-btn" onclick="quickLog(\\'/' + name + '\\')">log</button>' +
      '</div>';
  };

  const prn = (name, label) => {
    const last = findLastMed(name);
    const sub = last
      ? '<span class="sub">PRN · last ' + fmtTime(last.start_ts) + '</span>'
      : '<span class="sub">PRN · not logged today</span>';
    return '<div class="med-row">' +
      '<div class="med-info"><div class="name">' + label + '</div>' + sub + '</div>' +
      '<button class="med-btn" onclick="quickLog(\\'/' + name + '\\')">log</button>' +
      '</div>';
  };

  container.innerHTML = '<div class="meds-section">' +
    '<div class="meds-title">Mom\\'s meds</div>' +
    scheduled("tylenol", "Tylenol", 500) +
    scheduled("ibuprofen", "Ibuprofen", 600) +
    prn("oxy", "Oxy") +
    '</div>';
}

async function api(path, opts) {
  const res = await fetch(path, Object.assign({
    headers: { "X-Token": token, "content-type": "application/json" }
  }, opts || {}));
  if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); token = ""; promptToken(); throw new Error("unauthorized"); }
  return res;
}

async function submitText() {
  const input = document.getElementById("freetext");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  try {
    const r = await api("/log", { method: "POST", body: JSON.stringify({ text }) });
    const data = await r.json();
    if (data.ok) showToast(data.message || "logged");
    else showToast("error: " + (data.error || "unknown"));
    load();
  } catch (e) { showToast("error: " + e.message); }
}

async function load() {
  if (!token) { promptToken(); return; }
  try {
    const r = await api("/api/events");
    if (!r.ok) throw new Error("load failed");
    currentEvents = (await r.json()).events;
  } catch (e) {
    document.getElementById("events-container").innerHTML = '<div class="empty">error: ' + e.message + '</div>';
    return;
  }
  renderQuickAndBanner();
  renderMeds();
  renderEvents();
}

async function quickLog(text) {
  try {
    const r = await api("/log", { method: "POST", body: JSON.stringify({ text }) });
    const data = await r.json();
    if (data.ok) showToast(data.message || "logged");
    else showToast("error: " + (data.error || "unknown"));
    load();
  } catch (e) { showToast("error: " + e.message); }
}

function bottlePrompt() {
  const oz = prompt("Bottle ounces?", "3");
  if (oz === null) return;
  const num = parseFloat(oz);
  if (isNaN(num) || num <= 0) { showToast("invalid number"); return; }
  quickLog("/feed start bottle " + num);
}

function renderQuickAndBanner() {
  const openFeed = currentEvents.find(e => e.kind === "feed" && e.end_ts === null);

  const btn = (emoji, label, action, disabled) =>
    '<button class="qbtn"' + (disabled ? ' disabled' : '') + ' onclick="' + action + '">' +
    '<span class="emoji">' + emoji + '</span>' + label + '</button>';

  const row1 =
    btn('\u{1F4A7}', 'pee', "quickLog('/pee')") +
    btn('\u{1F4A9}', 'poop', "quickLog('/poop')") +
    btn('\u{1F4A7}\u{1F4A9}', 'both', "quickLog('/diaper both')");

  const row2 = openFeed
    ? btn('\u{1F448}', 'feed L', "quickLog('/feed start left')", true) +
      btn('\u{1F449}', 'feed R', "quickLog('/feed start right')", true) +
      btn('\u2713', 'end feed', "quickLog('/feed end')")
    : btn('\u{1F448}', 'feed L', "quickLog('/feed start left')") +
      btn('\u{1F449}', 'feed R', "quickLog('/feed start right')") +
      btn('\u{1F37C}', 'bottle', "bottlePrompt()");

  document.getElementById("quick-container").innerHTML =
    '<div class="quick-grid">' + row1 + '</div>' +
    '<div class="quick-grid">' + row2 + '</div>';

  const openEvent = currentEvents.find(e => e.end_ts === null);
  const banner = document.getElementById("in-progress-container");
  if (openEvent) {
    banner.innerHTML = '<div class="in-progress"><div>' + labelFor(openEvent) + ' \u00b7 started ' + fmtTime(openEvent.start_ts) + '</div>' +
      '<button onclick="endEvent(' + openEvent.id + ')">End</button></div>';
  } else {
    banner.innerHTML = "";
  }
}

function renderEvents() {
  const container = document.getElementById("events-container");
  if (!container) return;
  if (currentEvents.length === 0) {
    container.innerHTML = '<div class="empty">no events yet</div>';
    return;
  }
  if (currentView === "calendar") {
    container.innerHTML = renderCalendar();
  } else {
    container.innerHTML = renderList();
  }
}

function renderList() {
  let html = '';
  let currentDay = '';
  for (const ev of currentEvents) {
    const k = dayKey(ev.start_ts);
    if (k !== currentDay) {
      html += '<div class="day-header">' + (isToday(ev.start_ts) ? "Today" : k) + '</div>';
      currentDay = k;
    }
    const d = ev.details ? JSON.parse(ev.details) : {};
    const dotClass = ev.kind === "diaper" ? (d.diaper_type || "pee") : ev.kind;
    const openClass = ev.end_ts === null ? " open" : "";
    const dur = ev.end_ts ? '<span class="dur">' + fmtDur(ev.end_ts - ev.start_ts) + '</span>' : '';
    html += '<div class="event" onclick="openEdit(' + ev.id + ')">' +
      '<div class="dot ' + dotClass + openClass + '"></div>' +
      '<div class="label">' + labelFor(ev) + dur + '</div>' +
      '<div class="time">' + fmtTime(ev.start_ts) + '</div>' +
      '</div>';
  }
  return html;
}

function renderCalendar() {
  const days = {};
  for (const ev of currentEvents) {
    const key = startOfDay(ev.start_ts);
    if (!days[key]) days[key] = [];
    days[key].push(ev);
  }
  const sortedKeys = Object.keys(days).sort((a, b) => b - a);
  let html = '';
  for (const key of sortedKeys) {
    const dayStart = parseInt(key, 10);
    const dayEnd = dayStart + 86400000;
    const label = isToday(dayStart) ? "Today" : dayKey(dayStart);
    html += '<div class="cal-day"><div class="cal-day-label">' + label + '</div>';
    html += '<div class="cal-track">';
    for (let h = 0; h <= 24; h += 6) {
      const pct = (h / 24) * 100;
      html += '<div class="cal-hour" style="left:' + pct + '%"></div>';
      if (h < 24) {
        html += '<div class="cal-hour-label" style="left:' + pct + '%">' + h + '</div>';
      }
    }
    for (const ev of days[key]) {
      const start = Math.max(ev.start_ts, dayStart);
      const end = ev.end_ts ? Math.min(ev.end_ts, dayEnd) : Math.min(Date.now(), dayEnd);
      const leftPct = ((start - dayStart) / 86400000) * 100;
      const widthPct = ((end - start) / 86400000) * 100;
      const d = ev.details ? JSON.parse(ev.details) : {};
      if (ev.kind === "diaper") {
        const cls = d.diaper_type || "pee";
        html += '<div class="cal-dot ' + cls + '" style="left:' + leftPct + '%" onclick="openEdit(' + ev.id + ')"></div>';
      } else if (ev.kind === "med") {
        html += '<div class="cal-dot med" style="left:' + leftPct + '%" onclick="openEdit(' + ev.id + ')"></div>';
      } else {
        const openCls = ev.end_ts === null ? " open" : "";
        let heightStyle = "";
        if (ev.kind === "feed") {
          const durMin = (end - start) / 60000;
          const ratio = Math.min(durMin / 30, 1);
          const maxH = 26;
          const h = Math.max(ratio * maxH, 4);
          heightStyle = ";top:" + (40 - h) + "px;bottom:4px";
        }
        html += '<div class="cal-block ' + ev.kind + openCls + '" style="left:' + leftPct + '%;width:' + Math.max(widthPct, 0.3) + '%' + heightStyle + '" onclick="openEdit(' + ev.id + ')"></div>';
      }
    }
    html += '</div></div>';
  }
  return html;
}

function openEdit(id) {
  const ev = currentEvents.find((e) => e.id === id);
  if (!ev) return;
  const d = ev.details ? JSON.parse(ev.details) : {};
  const modal = document.getElementById("modal");
  let fields = '<div class="modal-row"><label>Start</label><input id="ed-start" type="datetime-local" value="' + tsToLocalInput(ev.start_ts) + '"></div>';
  if (ev.kind !== "diaper" && ev.kind !== "med") {
    fields += '<div class="modal-row"><label>End</label><input id="ed-end" type="datetime-local" value="' + (ev.end_ts ? tsToLocalInput(ev.end_ts) : '') + '"></div>';
  }
  if (ev.kind === "feed") {
    fields += '<div class="modal-row"><label>Side</label><select id="ed-side">' +
      ['left', 'right', 'bottle'].map(s => '<option value="' + s + '"' + (d.side === s ? ' selected' : '') + '>' + s + '</option>').join('') +
      '</select></div>';
    fields += '<div class="modal-row"><label>Ounces (if bottle)</label><input id="ed-oz" type="number" step="0.5" min="0" value="' + (d.bottle_oz || '') + '"></div>';
  }
  if (ev.kind === "diaper") {
    fields += '<div class="modal-row"><label>Type</label><select id="ed-type">' +
      ['pee', 'poop', 'both'].map(s => '<option value="' + s + '"' + (d.diaper_type === s ? ' selected' : '') + '>' + s + '</option>').join('') +
      '</select></div>';
  }
  if (ev.kind === "med") {
    fields += '<div class="modal-row"><label>Medication</label><select id="ed-med">' +
      ['tylenol', 'ibuprofen', 'oxy'].map(s => '<option value="' + s + '"' + (d.med_name === s ? ' selected' : '') + '>' + s + '</option>').join('') +
      '</select></div>';
    fields += '<div class="modal-row"><label>Dose (mg)</label><input id="ed-dose" type="number" min="0" value="' + (d.dose_mg || '') + '"></div>';
  }
  modal.innerHTML = '<div class="modal"><h2>Edit ' + ev.kind + '</h2>' + fields +
    '<div class="modal-actions">' +
    '<button class="btn-cancel" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-delete" onclick="deleteEvent(' + id + ')">Delete</button>' +
    '<button class="btn-save" onclick="saveEdit(' + id + ',\\'' + ev.kind + '\\')">Save</button>' +
    '</div></div>';
  modal.classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
}

async function saveEdit(id, kind) {
  const ev = currentEvents.find((e) => e.id === id);
  if (!ev) return;
  const patch = { details: ev.details ? JSON.parse(ev.details) : {} };
  const startEl = document.getElementById("ed-start");
  if (startEl && startEl.value) patch.start_ts = localInputToTs(startEl.value);
  const endEl = document.getElementById("ed-end");
  if (endEl) patch.end_ts = endEl.value ? localInputToTs(endEl.value) : null;
  if (kind === "feed") {
    const side = document.getElementById("ed-side").value;
    const oz = parseFloat(document.getElementById("ed-oz").value);
    patch.details = { side };
    if (!isNaN(oz) && oz > 0) patch.details.bottle_oz = oz;
  } else if (kind === "diaper") {
    patch.details = { diaper_type: document.getElementById("ed-type").value };
    patch.end_ts = patch.start_ts;
  } else if (kind === "med") {
    patch.details = { med_name: document.getElementById("ed-med").value };
    const dose = parseFloat(document.getElementById("ed-dose").value);
    if (!isNaN(dose) && dose > 0) patch.details.dose_mg = dose;
    patch.end_ts = patch.start_ts;
  }
  try {
    const r = await api("/api/events/" + id, { method: "POST", body: JSON.stringify(patch) });
    if (!r.ok) throw new Error("save failed");
    closeModal();
    showToast("saved");
    load();
  } catch (e) { showToast("error: " + e.message); }
}

async function endEvent(id) {
  try {
    await api("/api/events/" + id, {
      method: "POST",
      body: JSON.stringify({ end_ts: Date.now() })
    });
    load();
  } catch (e) { showToast("error: " + e.message); }
}

async function deleteEvent(id) {
  if (!confirm("Delete this event?")) return;
  try {
    await api("/api/events/" + id, { method: "DELETE" });
    closeModal();
    load();
  } catch (e) { showToast("error: " + e.message); }
}

if (!token) {
  promptToken();
} else {
  renderShell();
  load();
}

setInterval(() => {
  if (!token) return;
  if (document.visibilityState !== "visible") return;
  const input = document.getElementById("freetext");
  if (input && input === document.activeElement) return;
  if (document.getElementById("modal").classList.contains("show")) return;
  load();
}, 30000);
</script>
</body>
</html>`;
