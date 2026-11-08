/**
 * Soi độ khớp giữa animation và lời nói, từng dòng một.
 *
 *   npm run cues -- --ep ep01
 *
 * In ra: mỗi bullet / mỗi bước sơ đồ rơi vào giây nào, và lúc đó giọng đang nói gì.
 * Cột cuối là chẩn đoán:
 *   khớp     — mốc rơi đúng chỗ từ khoá của dòng đó vang lên
 *   nội suy  — không dò được từ khoá, mốc là ước lượng giữa hai mốc chắc chắn
 *   THIẾU    — scene có nhiều bước nhưng không có mốc nào (animation đang chia đều)
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { argOf, loadEpisode, voiceDir } from "./lib.ts";
import type { Word } from "../src/types.ts";

const episodeId = argOf("ep", "ep01")!;
const episode = loadEpisode(episodeId);
const manifestPath = path.join(voiceDir(episodeId), "manifest.json");
if (!existsSync(manifestPath)) {
  console.error(`Chưa có ${manifestPath} — chạy npm run sync trước.`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

const norm = (t: string) =>
  t.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "");

const spokenAt = (words: Word[], ms: number, n = 7) =>
  words
    .filter((w) => w.startMs >= ms - 60)
    .slice(0, n)
    .map((w) => w.text)
    .join(" ");

let problems = 0;

for (const scene of episode.scenes) {
  const entry = manifest.scenes?.[scene.id];
  if (!entry) continue;

  const labels: string[] =
    scene.type === "bullets" ? scene.bullets : scene.type === "diagram" ? (scene.cues ?? []) : [];
  const stepsNeeded = scene.type === "diagram" && !scene.cues ? "?" : labels.length;

  if (scene.type === "diagram" && !scene.cues) {
    console.log(
      `\n${scene.id}  ${scene.type}  (${entry.durationSeconds}s)\n` +
        `   THIẾU mốc — sơ đồ "${scene.name}" đang dựng theo lịch chia đều, không bám lời nói.\n` +
        `   Thêm "cues": [...] vào scene, mỗi bước một từ khoá, đúng thứ tự các bước của sơ đồ.`,
    );
    problems++;
    continue;
  }
  if (!labels.length) continue;

  console.log(`\n${scene.id}  ${scene.type}  (${entry.durationSeconds}s, ${stepsNeeded} bước)`);
  const words: Word[] = entry.words ?? [];
  const cues: number[] = entry.cues ?? [];

  labels.forEach((label, i) => {
    const ms = cues[i];
    if (ms == null) {
      console.log(`   ${String(i + 1).padStart(2)}  —      THIẾU   ${label}`);
      problems++;
      return;
    }
    const heard = spokenAt(words, ms);
    // Khớp = câu đang nói có chứa từ khoá đã chỉ định (nếu scene khai báo cues),
    // còn không thì có chứa ít nhất một từ đặc trưng của chính dòng đó.
    const explicit: string | undefined = scene.cues?.[i];
    const tokens = explicit
      ? explicit.split(/\s+/).map(norm).filter(Boolean)
      : label
          .split(/\s+/)
          .map(norm)
          .filter((t) => t.length > 2);
    const heardTokens = new Set(heard.split(/\s+/).map(norm));
    const hit = tokens.filter((t) => heardTokens.has(t)).length;
    const verdict = hit >= 1 ? "khớp   " : "nội suy";
    if (hit < 1) problems++;
    console.log(
      `   ${String(i + 1).padStart(2)}  ${(ms / 1000).toFixed(1)}s  ${verdict} ` +
        `"${label.slice(0, 44)}"\n       nghe thấy: ${heard}`,
    );
  });
}

console.log(
  problems === 0
    ? "\nTất cả mốc đều bám lời nói."
    : `\n${problems} chỗ cần xem lại (xem dòng "nội suy" và "THIẾU" ở trên).`,
);
