/**
 * Chỉnh lại nhịp đọc của một tập đã sinh, không gọi API lần nào.
 *
 *   node scripts/retime.ts --ep ep03 --target 19.0               # cả tập một hệ số
 *   node scripts/retime.ts --ep ep03 --target 19.0 --per-scene   # mỗi scene một hệ số
 *   node scripts/retime.ts --ep ep03 --factor 0.85               # ép thẳng hệ số
 *
 * Vì sao cần: mỗi engine, mỗi tầng key đọc một nhịp khác nhau. Gateway bỏ qua `style`
 * nên bản qua gateway đọc chậm hơn, bù bằng `speed` thì hay quá tay. Script này đo
 * nhịp thật từ manifest rồi kéo cả tập về đúng nhịp của tập mẫu.
 *
 * `--per-scene` là chế độ cần dùng khi một tập có scene sinh từ nhiều tầng key khác
 * nhau (3.8 trực tiếp và 3.1 qua gateway đọc lệch nhịp nhau tới 18%). Nó đo và kéo
 * riêng từng scene về đúng nhịp đích, nên cả tập nghe đều dù sinh từ nhiều model.
 *
 * Nó đổi cả mp3 (ffmpeg atempo, không đổi cao độ) lẫn timing trong *.words.json,
 * nên phụ đề và mốc animation vẫn khớp. Chạy xong nhớ `npm run sync`.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { argOf, hasFlag, loadEpisode, voiceDir } from "./lib.ts";
import type { Word } from "../src/types.ts";

const episodeId = argOf("ep", "ep01")!;
const target = Number(argOf("target", "0"));
const forced = Number(argOf("factor", "0"));
const perScene = hasFlag("per-scene");

const episode = loadEpisode(episodeId);
const dir = voiceDir(episodeId);
const manifestPath = path.join(dir, "manifest.json");
if (!existsSync(manifestPath)) {
  console.error("Chưa có manifest — chạy npm run sync trước.");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

const strip = (t: string) => t.replace(/<[^>]{1,24}>/g, " ");
const chars = episode.scenes.reduce(
  (n: number, s: { narration: string }) => n + strip(s.narration).length,
  0,
);
const seconds = Object.values(manifest.scenes as Record<string, { durationSeconds: number }>).reduce(
  (n, s) => n + s.durationSeconds,
  0,
);
const rate = chars / seconds;

let factor = forced;
if (!factor) {
  if (!target) {
    console.error("Cần --target <ký tự/giây> hoặc --factor <hệ số>");
    process.exit(1);
  }
  factor = target / rate; // <1 là đọc chậm lại
}

console.log(
  `${episodeId}: cả tập ${rate.toFixed(1)} ký tự/giây` +
    (perScene ? " — chỉnh riêng từng scene" : ` → hệ số ${factor.toFixed(3)}`),
);
if (!perScene && Math.abs(factor - 1) < 0.02) {
  console.log("Lệch dưới 2%, không cần chỉnh.");
  process.exit(0);
}

let touched = 0;
for (const scene of episode.scenes) {
  const mp3 = path.join(dir, `${scene.id}.mp3`);
  if (!existsSync(mp3)) continue;

  let f = factor;
  if (perScene) {
    const entry = (manifest.scenes as Record<string, { durationSeconds: number }>)[scene.id];
    if (!entry) continue;
    const sceneRate = strip(scene.narration).length / entry.durationSeconds;
    f = (target || rate) / sceneRate;
    // Chỉ đụng vào scene lệch nhiều — nhịp dao động vài phần trăm giữa các scene là
    // tự nhiên của giọng người, ép tất cả về đúng một con số nghe lại máy móc.
    if (Math.abs(f - 1) < 0.08) continue;
  }

  const tmp = mp3.replace(/\.mp3$/, ".rt.mp3");
  execFileSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", mp3,
    "-filter:a", `atempo=${f.toFixed(4)}`, "-c:a", "libmp3lame", "-b:a", "128k", tmp,
  ]);
  renameSync(tmp, mp3);

  // Audio dài ra 1/f lần thì mọi mốc thời gian cũng giãn đúng chừng đó
  const wordsFile = path.join(dir, `${scene.id}.words.json`);
  if (existsSync(wordsFile)) {
    const words: Word[] = JSON.parse(readFileSync(wordsFile, "utf-8"));
    writeFileSync(
      wordsFile,
      JSON.stringify(
        words.map((w) => ({
          text: w.text,
          startMs: Math.round(w.startMs / f),
          endMs: Math.round(w.endMs / f),
        })),
        null,
        2,
      ),
      "utf-8",
    );
  }

  const lufs = mp3 + ".lufs";
  if (existsSync(lufs)) renameSync(lufs, lufs + ".old");
  touched++;
  process.stdout.write(".");
}

console.log(`
Chỉnh ${touched} scene. Tiếp theo: npm run sync -- --ep ${episodeId}`);
