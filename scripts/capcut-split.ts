/**
 * Cắt 1 file audio dài (xuất từ CapCut) thành từng scene, dựa trên khoảng lặng.
 *
 *   node scripts/capcut-split.ts --ep ep01 --in capcut/ep01-raw.mp3 [--noise -32dB] [--min 0.6]
 *
 * Script chọn đúng (số scene - 1) khoảng lặng dài nhất làm điểm cắt, nên hãy
 * để một dòng trống giữa các scene khi dán text vào CapCut.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { argOf, loadEpisode, root, voiceDir } from "./lib.ts";

const episodeId = argOf("ep", "ep01")!;
const input = argOf("in");
const noise = argOf("noise", "-32dB")!;
const minSilence = Number(argOf("min", "0.6"));

if (!input || !existsSync(path.resolve(root, input))) {
  console.error("Thiếu --in <đường dẫn audio>");
  process.exit(1);
}
const inputPath = path.resolve(root, input);
const episode = loadEpisode(episodeId);
const capcutScenes = episode.scenes.filter(
  (s: { voice?: { provider?: string } }) =>
    (s.voice?.provider ?? episode.voice.provider) === "capcut",
);
const targets = capcutScenes.length ? capcutScenes : episode.scenes;

// ffmpeg silencedetect -> danh sách khoảng lặng
const log = execFileSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-i",
    inputPath,
    "-af",
    `silencedetect=noise=${noise}:d=${minSilence}`,
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
).toString();

const silences: { start: number; end: number; dur: number }[] = [];
const re = /silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g;
let m: RegExpExecArray | null;
while ((m = re.exec(log))) {
  silences.push({ start: Number(m[1]), end: Number(m[2]), dur: Number(m[3]) });
}

const needed = targets.length - 1;
if (silences.length < needed) {
  console.error(
    `Chỉ tìm được ${silences.length} khoảng lặng nhưng cần ${needed}. ` +
      `Thử --noise -28dB hoặc --min 0.4, hoặc xuất từng scene riêng.`,
  );
  process.exit(1);
}

const cuts = silences
  .slice()
  .sort((a, b) => b.dur - a.dur)
  .slice(0, needed)
  .sort((a, b) => a.start - b.start)
  .map((s) => (s.start + s.end) / 2);

const outDir = voiceDir(episodeId);
mkdirSync(outDir, { recursive: true });
const bounds = [0, ...cuts, Number.POSITIVE_INFINITY];

targets.forEach((scene: { id: string }, i: number) => {
  const from = bounds[i];
  const to = bounds[i + 1];
  const out = path.join(outDir, `${scene.id}.mp3`);
  const args = ["-y", "-hide_banner", "-loglevel", "error", "-i", inputPath, "-ss", String(from)];
  if (isFinite(to)) args.push("-to", String(to));
  args.push("-c:a", "libmp3lame", "-b:a", "128k", out);
  execFileSync("ffmpeg", args);
  console.log(`· ${scene.id}: ${from.toFixed(2)}s -> ${isFinite(to) ? to.toFixed(2) + "s" : "hết"}`);
});

console.log(`\nTiếp theo: npm run sync -- --ep ${episodeId}`);
