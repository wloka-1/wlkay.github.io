import type { EventKind, EventDetails } from "./db";

export interface ParsedFeedStart {
  kind: "feed";
  action: "start";
  side: "left" | "right" | "bottle";
  bottle_oz?: number;
  start_ts_offset_min: number;
}

export interface ParsedFeedEnd {
  kind: "feed";
  action: "end";
  end_ts_offset_min: number;
}

export interface ParsedDiaper {
  kind: "diaper";
  diaper_type: "pee" | "poop" | "both";
  start_ts_offset_min: number;
}

export interface ParsedSleepStart {
  kind: "sleep";
  action: "start";
  start_ts_offset_min: number;
}

export interface ParsedSleepEnd {
  kind: "sleep";
  action: "end";
  end_ts_offset_min: number;
}

export type Parsed =
  | ParsedFeedStart
  | ParsedFeedEnd
  | ParsedDiaper
  | ParsedSleepStart
  | ParsedSleepEnd;

export interface ParseError {
  error: string;
}

export type ParseResult = Parsed | ParseError;

export function parseCommand(text: string): Parsed | null {
  const t = text.trim().toLowerCase();

  if (/^\/?(poop|pooped)\b/.test(t))
    return { kind: "diaper", diaper_type: "poop", start_ts_offset_min: 0 };
  if (/^\/?(pee|peed)\b/.test(t))
    return { kind: "diaper", diaper_type: "pee", start_ts_offset_min: 0 };
  if (/^\/?diaper\s+(both|all)\b/.test(t))
    return { kind: "diaper", diaper_type: "both", start_ts_offset_min: 0 };

  const feedBottle = t.match(/^\/?feed\s+start\s+bottle(?:\s+(\d+(?:\.\d+)?))?/);
  if (feedBottle) {
    const oz = feedBottle[1] ? parseFloat(feedBottle[1]) : undefined;
    return {
      kind: "feed",
      action: "start",
      side: "bottle",
      bottle_oz: oz,
      start_ts_offset_min: 0,
    };
  }
  const feedSide = t.match(/^\/?feed\s+start\s+(left|right)/);
  if (feedSide) {
    return {
      kind: "feed",
      action: "start",
      side: feedSide[1] as "left" | "right",
      start_ts_offset_min: 0,
    };
  }
  if (/^\/?feed\s+end\b/.test(t) || /^\/?done\b/.test(t))
    return { kind: "feed", action: "end", end_ts_offset_min: 0 };

  if (/^\/?sleep\s+start\b/.test(t))
    return { kind: "sleep", action: "start", start_ts_offset_min: 0 };
  if (/^\/?sleep\s+end\b/.test(t) || /^\/?wake\b/.test(t))
    return { kind: "sleep", action: "end", end_ts_offset_min: 0 };

  return null;
}

const PARSE_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["feed", "diaper", "sleep", "error"] },
    action: { type: "string", enum: ["start", "end"] },
    side: { type: "string", enum: ["left", "right", "bottle"] },
    bottle_oz: { type: "number" },
    diaper_type: { type: "string", enum: ["pee", "poop", "both"] },
    start_ts_offset_min: { type: "number" },
    end_ts_offset_min: { type: "number" },
    error: { type: "string" },
  },
  required: ["kind"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You parse short messages a parent types about their newborn baby into structured JSON events.

Output shapes (pick ONE based on intent):
- Diaper: {"kind":"diaper","diaper_type":"pee"|"poop"|"both","start_ts_offset_min":N}
- Feed start: {"kind":"feed","action":"start","side":"left"|"right"|"bottle","bottle_oz":N,"start_ts_offset_min":N}
  (bottle_oz only when side is "bottle"; omit if not specified)
- Feed end: {"kind":"feed","action":"end","end_ts_offset_min":N}
- Sleep start: {"kind":"sleep","action":"start","start_ts_offset_min":N}
- Sleep end: {"kind":"sleep","action":"end","end_ts_offset_min":N}
- Unparseable: {"kind":"error","error":"reason"}

Offsets are MINUTES relative to now. "6 min ago" -> -6. "just now" or omitted -> 0.
"done", "finished", "wake up" usually mean ending the current open event.
If ambiguous whether a feed is starting or ending, pick based on words like "starting"/"started" (start) vs "done"/"finished"/"ended" (end).
Breast: "left" or "right"; bottle: parse ounces from numbers like "4oz", "3.5 oz", "2 ounces".

Return JSON only, no prose.`;

export async function parseWithLLM(
  text: string,
  apiKey: string,
): Promise<ParseResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: PARSE_SCHEMA },
      },
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock?.text) return { error: "no text in model response" };

  try {
    const parsed = JSON.parse(textBlock.text);
    if (parsed.kind === "error") return { error: parsed.error ?? "unparseable" };
    return parsed as Parsed;
  } catch {
    return { error: "invalid json from model" };
  }
}

export function offsetMsFromMinutes(mins: number | undefined): number {
  if (mins === undefined || mins === null) return 0;
  return Math.round(mins * 60_000);
}

export function describeForSiri(
  kind: EventKind,
  details: EventDetails,
  ts: number,
  action?: "start" | "end",
): string {
  const time = new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (kind === "diaper") {
    return `Logged ${details.diaper_type ?? "diaper"} at ${time}`;
  }
  if (kind === "feed") {
    if (action === "end") return `Ended feed at ${time}`;
    const side = details.side ?? "feed";
    const oz = details.bottle_oz ? ` (${details.bottle_oz} oz)` : "";
    return `Started ${side} feed${oz} at ${time}`;
  }
  if (kind === "sleep") {
    return action === "end" ? `Ended sleep at ${time}` : `Started sleep at ${time}`;
  }
  return `Logged at ${time}`;
}
