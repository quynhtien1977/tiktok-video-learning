/**
 * Sinh giọng đọc bằng Gemini TTS — engine duy nhất (trong bốn cái đã đo) thật sự
 * phát ra tiếng cười, thở dài giữa câu bằng tag `<laugh>`, `<sigh>`, `<short pause>`.
 *
 *   node --env-file-if-exists=.env scripts/tts-gemini.ts --ep ep01
 *   node --env-file-if-exists=.env scripts/tts-gemini.ts --ep ep01 --only s07 --force
 *   node --env-file-if-exists=.env scripts/tts-gemini.ts --quota        # chỉ xem còn bao nhiêu lượt
 *
 * Hai tầng key, khai báo trong .env theo thứ tự GEMINI_API_KEY_1, _2, ...:
 *   - Key Google trực tiếp  -> model gemini-3.8-flash-tts, MIỄN PHÍ 10 lượt/ngày/key.
 *     Đây là model mới nhất và gateway không có.
 *   - Key Beeknoee (sk-bee-) -> model google/gemini-3.1-flash-tts-preview, TRẢ TIỀN
 *     theo lượt. Chỉ dùng khi tầng free hết lượt, để một tập không đứng hình giữa chừng.
 *
 * Script tự phân loại key theo tiền tố, ghi sổ số lượt đã dùng trong ngày (theo giờ
 * Thái Bình Dương — đó là mốc Google reset quota) vào .gemini-usage.json.
 *
 * Gemini không trả timing từng chữ, nên sau bước này vẫn phải chạy:
 *   python -I scripts/align_stt.py --ep <ep>   rồi   npm run sync -- --ep <ep>
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { argOf, hasFlag, loadEpisode, root, voiceDir } from "./lib.ts";

const DIRECT_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const DIRECT_MODEL = "gemini-3.8-flash-tts";
const GATEWAY_URL = "https://platform.beeknoee.com/v1/audio/speech";
const GATEWAY_MODEL = "google/gemini-3.1-flash-tts-preview";

const FREE_PER_DAY = 10; // hạn mức free tier mỗi key, mỗi ngày
const MIN_GAP_MS = 21_000; // free tier còn chặn 3 lượt/phút -> giãn cách mỗi key
const LEDGER = path.join(root, ".gemini-usage.json");

type Key = {
  env: string;
  value: string;
  kind: "direct" | "gateway";
  fp: string;
  used: number;
  exhausted: boolean;
  lastCallAt: number;
};

/** Google reset quota theo ngày giờ Thái Bình Dương, không phải nửa đêm giờ Việt Nam. */
const pacificDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const loadKeys = (): Key[] => {
  const keys: Key[] = [];
  for (let i = 1; i <= 9; i++) {
    const env = `GEMINI_API_KEY_${i}`;
    const value = (process.env[env] ?? "").trim();
    if (!value) continue;
    keys.push({
      env,
      value,
      kind: value.startsWith("sk-") ? "gateway" : "direct",
      fp: createHash("sha256").update(value).digest("hex").slice(0, 8),
      used: 0,
      exhausted: false,
      lastCallAt: 0,
    });
  }
  // Free trước, trả tiền sau
  return keys.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "direct" ? -1 : 1));
};

const readLedger = (keys: Key[]) => {
  const today = pacificDate();
  let data: { date?: string; used?: Record<string, number> } = {};
  if (existsSync(LEDGER)) {
    try {
      data = JSON.parse(readFileSync(LEDGER, "utf-8"));
    } catch {
      data = {};
    }
  }
  if (data.date !== today) return; // sang ngày mới thì bỏ sổ cũ
  for (const k of keys) {
    k.used = data.used?.[k.fp] ?? 0;
    if (k.kind === "direct" && k.used >= FREE_PER_DAY) k.exhausted = true;
  }
};

const writeLedger = (keys: Key[]) => {
  const used: Record<string, number> = {};
  for (const k of keys) used[k.fp] = k.used;
  writeFileSync(LEDGER, JSON.stringify({ date: pacificDate(), used }, null, 2), "utf-8");
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const quotaReport = (keys: Key[]) => {
  const free = keys.filter((k) => k.kind === "direct");
  const left = free.reduce((n, k) => n + Math.max(0, FREE_PER_DAY - k.used), 0);
  const paid = keys.filter((k) => k.kind === "gateway").length;
  console.log(`Ngày (giờ Thái Bình Dương): ${pacificDate()}`);
  for (const k of keys) {
    const tag = k.kind === "direct" ? `free ${k.used}/${FREE_PER_DAY}` : "trả tiền, không giới hạn";
    console.log(`  ${k.env.padEnd(18)} ${k.kind.padEnd(8)} ${tag}`);
  }
  console.log(`\nCòn ${left} lượt miễn phí hôm nay` + (paid ? `, sau đó tràn sang ${paid} key trả tiền.` : "."));
  return left;
};

type Synth = { audio: Buffer; format: "wav" | "mp3"; via: string };

const callDirect = async (key: Key, text: string, voice: string, style: string): Promise<Synth> => {
  const body = {
    model: DIRECT_MODEL,
    input: [
      {
        type: "user_input",
        content: [
          { type: "text", text, annotations: [{ type: "speech_metadata", style }] },
        ],
      },
    ],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice }] },
  };
  const r = await fetch(DIRECT_URL, {
    method: "POST",
    headers: { "x-goog-api-key": key.value, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j: Record<string, unknown> = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = JSON.stringify(j);
    const perDay = /per day/i.test(msg);
    const err = new Error(msg.slice(0, 200)) as Error & { status?: number; perDay?: boolean };
    err.status = r.status;
    err.perDay = perDay;
    throw err;
  }
  const steps = (j.steps ?? []) as { content?: { type?: string; data?: string }[] }[];
  const b64 = steps
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "audio" && c.data)
    .pop()?.data;
  if (!b64) throw new Error("không có audio trong phản hồi");
  return { audio: Buffer.from(b64, "base64"), format: "wav", via: `${key.env} · ${DIRECT_MODEL}` };
};

const callGateway = async (key: Key, text: string, voice: string): Promise<Synth> => {
  const r = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key.value}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GATEWAY_MODEL, input: text, voice }),
  });
  if (!r.ok || (r.headers.get("content-type") ?? "").includes("json")) {
    const err = new Error((await r.text()).slice(0, 200)) as Error & { status?: number };
    err.status = r.status;
    throw err;
  }
  return {
    audio: Buffer.from(await r.arrayBuffer()),
    format: "mp3",
    via: `${key.env} · ${GATEWAY_MODEL}`,
  };
};

/** Thử lần lượt từng key: free trước, hết lượt thì sang key kế, hết cả thì sang trả tiền. */
const synth = async (keys: Key[], text: string, voice: string, style: string): Promise<Synth> => {
  let lastErr: Error | null = null;
  // --paid / --free: ép cả tập chạy trên cùng một tầng. Trộn hai tầng nghĩa là trộn
  // hai model (3.8 trực tiếp vs 3.1 qua gateway), nghe sẽ không đồng nhất.
  const onlyPaid = hasFlag("paid");
  const onlyFree = hasFlag("free");

  for (const key of keys) {
    if (key.exhausted) continue;
    if (onlyPaid && key.kind !== "gateway") continue;
    if (onlyFree && key.kind !== "direct") continue;

    for (let attempt = 0; attempt < 3; attempt++) {
      const wait = key.lastCallAt + MIN_GAP_MS - Date.now();
      if (key.kind === "direct" && wait > 0) await sleep(wait);

      try {
        key.lastCallAt = Date.now();
        const out = key.kind === "direct"
          ? await callDirect(key, text, voice, style)
          : await callGateway(key, text, voice);
        key.used += 1;
        return out;
      } catch (e) {
        const err = e as Error & { status?: number; perDay?: boolean };
        lastErr = err;
        if (err.status === 429) {
          if (err.perDay) {
            key.exhausted = true;
            console.log(`     ${key.env}: hết lượt ngày, chuyển key khác`);
            break;
          }
          await sleep(MIN_GAP_MS); // chạm giới hạn phút, chờ rồi thử lại chính key này
          continue;
        }
        break; // lỗi khác: đổi key
      }
    }
  }
  throw lastErr ?? new Error("không còn key nào dùng được");
};

const main = async () => {
  const keys = loadKeys();
  if (!keys.length) {
    console.error("Chưa có GEMINI_API_KEY_1..9 trong .env");
    process.exit(1);
  }
  readLedger(keys);

  if (hasFlag("quota")) {
    quotaReport(keys);
    return;
  }

  const episodeId = argOf("ep", "ep01")!;
  const only = argOf("only");
  const force = hasFlag("force");
  const episode = loadEpisode(episodeId);
  const outDir = voiceDir(episodeId);
  mkdirSync(outDir, { recursive: true });

  const todo = episode.scenes.filter((scene: Record<string, unknown>) => {
    if (only && scene.id !== only) return false;
    const sv = (scene.voice ?? {}) as Record<string, unknown>;
    const role = ((episode.voices ?? {})[(scene.speaker as string) ?? "host"] ?? {}) as Record<string, unknown>;
    const provider = sv.provider ?? role.provider ?? episode.voice.provider;
    if (provider !== "gemini") return false;
    return force || !existsSync(path.join(outDir, `${scene.id}.mp3`));
  });

  const freeLeft = quotaReport(keys);
  console.log(`\nCần sinh ${todo.length} scene.`);
  if (todo.length === 0) return;
  if (todo.length > freeLeft) {
    const over = todo.length - freeLeft;
    const paid = keys.filter((k) => k.kind === "gateway").length;
    console.log(
      paid
        ? `Vượt ${over} lượt so với hạn mức free — phần đó sẽ tính tiền qua key Beeknoee.`
        : `Thiếu ${over} lượt và không có key trả tiền. Chạy tiếp sẽ dừng giữa chừng.`,
    );
  }
  console.log("");

  for (const scene of todo) {
    const sv = (scene.voice ?? {}) as Record<string, string>;
    const role = ((episode.voices ?? {})[scene.speaker ?? "host"] ?? {}) as Record<string, string>;
    const resolved = { ...episode.voice, ...role, ...sv };
    const voice = resolved.name ?? "achird";
    const style = resolved.style ?? "clear, friendly teacher";

    const mp3 = path.join(outDir, `${scene.id}.mp3`);
    process.stdout.write(`· ${scene.id}: `);

    let out: Synth;
    try {
      out = await synth(keys, scene.narration, voice, style);
    } catch (e) {
      console.log(`LỖI ${(e as Error).message}`);
      writeLedger(keys);
      console.log("\nDừng lại. Chạy lại sau khi quota reset, các scene đã xong sẽ được bỏ qua.");
      process.exit(1);
    }

    if (out.format === "wav") {
      const wav = mp3.replace(/\.mp3$/, ".tmp.wav");
      writeFileSync(wav, out.audio);
      execFileSync("ffmpeg", [
        "-y", "-hide_banner", "-loglevel", "error", "-i", wav,
        "-c:a", "libmp3lame", "-b:a", "128k", mp3,
      ]);
      unlinkSync(wav);
    } else {
      writeFileSync(mp3, out.audio);
    }

    // Gateway bỏ qua style nên không chỉ đạo được nhịp đọc -> chỉnh bằng ffmpeg atempo
    const speed = Number(resolved.speed ?? 1);
    if (Math.abs(speed - 1) > 1e-3) {
      const sp = mp3.replace(/\.mp3$/, ".sp.mp3");
      execFileSync("ffmpeg", [
        "-y", "-hide_banner", "-loglevel", "error", "-i", mp3,
        "-filter:a", `atempo=${speed}`, "-c:a", "libmp3lame", "-b:a", "128k", sp,
      ]);
      renameSync(sp, mp3);
    }

    // Cắt khoảng lặng thừa hai đầu, giống đường Azure
    try {
      const trimmed = mp3.replace(/\.mp3$/, ".trim.mp3");
      execFileSync("ffmpeg", [
        "-y", "-hide_banner", "-loglevel", "error", "-i", mp3,
        "-af",
        "silenceremove=start_periods=1:start_silence=0.06:start_threshold=-45dB:" +
          "stop_periods=-1:stop_silence=0.18:stop_threshold=-45dB",
        "-c:a", "libmp3lame", "-b:a", "128k", trimmed,
      ]);
      renameSync(trimmed, mp3);
    } catch {
      /* không cắt được thì giữ nguyên */
    }

    writeLedger(keys);
    console.log(`xong (${(out.audio.length / 1024).toFixed(0)} KB) ← ${out.via}`);
  }

  console.log(`\nGemini không trả timing từng chữ. Tiếp theo:`);
  console.log(`  python -I scripts/align_stt.py --ep ${episodeId}`);
  console.log(`  npm run sync -- --ep ${episodeId}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
