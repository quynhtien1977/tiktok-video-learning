/**
 * Đọc mọi file audio trong public/voice/<ep>/ và sinh manifest.json
 * (thời lượng thật + timing từng chữ nếu có). Remotion lấy timeline từ file này.
 *
 *   node scripts/sync-audio.ts --ep ep01
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { argOf, loadEpisode, probeDuration, voiceDir } from "./lib.ts";
import { resolveCues } from "./cues.ts";

const episodeId = argOf("ep", "ep01")!;
const episode = loadEpisode(episodeId);
const dir = voiceDir(episodeId);
mkdirSync(dir, { recursive: true });

const scenes: Record<string, unknown> = {};
const missing: string[] = [];

for (const scene of episode.scenes) {
  const role = episode.voices?.[scene.speaker ?? "host"] ?? {};
  const provider = scene.voice?.provider ?? role.provider ?? episode.voice.provider;
  const mp3 = path.join(dir, `${scene.id}.mp3`);
  const wav = path.join(dir, `${scene.id}.wav`);
  const file = existsSync(mp3) ? mp3 : existsSync(wav) ? wav : null;

  if (!file) {
    missing.push(scene.id);
    continue;
  }

  const wordsFile = path.join(dir, `${scene.id}.words.json`);
  const words = existsSync(wordsFile)
    ? JSON.parse(readFileSync(wordsFile, "utf-8"))
    : undefined;

  // Chuẩn hoá âm lượng về -16 LUFS. Azure và CapCut phát ra mức khác nhau khá xa,
  // trộn hai giọng trong một tập mà không chuẩn hoá thì chỗ chuyển nghe cộm.
  const marker = file + ".lufs";
  if (!existsSync(marker)) {
    try {
      const tmp = file.replace(/\.(mp3|wav)$/, ".lufs.mp3");
      execFileSync("ffmpeg", [
        "-y", "-hide_banner", "-loglevel", "error", "-i", file,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:a", "libmp3lame", "-b:a", "128k", tmp,
      ]);
      renameSync(tmp, file);
      writeFileSync(marker, "-16 LUFS", "utf-8");
    } catch {
      // không chuẩn hoá được thì bỏ qua, không chặn pipeline
    }
  }

  const durationSeconds = Number(probeDuration(file).toFixed(3));

  // Mốc hiện bullet / bước sơ đồ, bám theo lúc lời nói thật sự tới ý đó
  const labels: string[] =
    scene.type === "bullets" ? scene.bullets : scene.type === "diagram" ? (scene.cues ?? []) : [];
  const cues =
    labels.length || scene.cues?.length
      ? resolveCues(words, labels, scene.cues, durationSeconds * 1000)
      : undefined;

  scenes[scene.id] = {
    file: `voice/${episodeId}/${path.basename(file)}`,
    durationSeconds,
    provider,
    words,
    cues,
  };
  console.log(
    `· ${scene.id}: ${durationSeconds}s (${provider}` +
      `${words ? `, ${words.length} từ` : ", không có timing"}` +
      `${cues ? `, mốc: ${cues.map((c) => (c / 1000).toFixed(1) + "s").join(" ")}` : ""})`,
  );
}

writeFileSync(
  path.join(dir, "manifest.json"),
  JSON.stringify(
    { episodeId, generatedAt: new Date().toISOString(), scenes },
    null,
    2,
  ),
  "utf-8",
);

const total = Object.keys(scenes).reduce(
  (sum, k) => sum + (scenes[k] as { durationSeconds: number }).durationSeconds,
  0,
);
console.log(`\nTổng thoại: ${Math.floor(total / 60)}p${Math.round(total % 60)}s`);
if (missing.length) {
  console.log(`Thiếu audio cho: ${missing.join(", ")}`);
}
