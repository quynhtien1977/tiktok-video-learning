/**
 * Soi tư thế nhân vật của từng scene, và những chỗ màn hình đứng im quá lâu.
 *
 *   npm run poses -- --ep ep01
 *
 * Dùng **chính hàm `resolvePoseTimeline` mà video đang chạy**, không chép lại logic —
 * nên số in ra ở đây luôn đúng bằng thứ người xem thấy.
 *
 * Hai thứ cần nhìn:
 *   - Mỗi scene đổi tư thế mấy lần, vào giây nào, và tư thế gì.
 *   - "Khoảng chết": quãng dài hơn 6 giây không có bullet nào hiện ra và cũng không đổi
 *     tư thế. Đây là thứ người xem đọc ra là "chậm". Scene `quote` và `outro` không có
 *     bullet nên gần như luôn cần một mốc cảm xúc để lấp.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { argOf, loadEpisode, voiceDir } from "./lib.ts";
import { resolvePoseTimeline } from "../src/poses.ts";
import type { Word } from "../src/types.ts";

const DEAD_MS = 6000;
const TAIL_DEFAULT = 0.4;
// Dưới ngưỡng này thì scene không thể đổi tư thế được: quy tắc đòi mỗi tư thế đứng
// tối thiểu 3s và không đổi trong 2s đầu/cuối. Cảnh báo "khoảng chết" ở những scene
// đó là báo động giả — hook và scene câu hỏi vốn chỉ dài 5–7 giây.
const MIN_SCENE_FOR_CHANGE_MS = 3000 * 2 + 2000 * 2;

const episodeId = argOf("ep", "ep01")!;
const episode = loadEpisode(episodeId);
const manifestPath = path.join(voiceDir(episodeId), "manifest.json");
if (!existsSync(manifestPath)) {
  console.error(`Chưa có ${manifestPath}. Chạy "npm run sync -- --ep ${episodeId}" trước.`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
  scenes: Record<string, { durationSeconds: number; words?: Word[]; cues?: number[] }>;
};

const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

let scenes = 0;
let changes = 0;
let deadTotal = 0;
let deadCovered = 0;
const poseUse = new Map<string, number>();

for (const [i, scene] of episode.scenes.entries()) {
  const entry = manifest.scenes[scene.id];
  if (!entry) continue;
  const durMs = entry.durationSeconds * 1000;
  const totalMs = durMs + (scene.tailSeconds ?? TAIL_DEFAULT) * 1000;

  const timeline = resolvePoseTimeline({
    pose: scene.pose,
    poses: scene.poses,
    sceneType: scene.type,
    narration: scene.narration,
    words: entry.words,
    sceneDurationMs: totalMs,
    sceneIndex: i,
  });

  scenes += 1;
  changes += timeline.length - 1;
  for (const step of timeline) poseUse.set(step.pose, (poseUse.get(step.pose) ?? 0) + 1);

  // Khoảng chết: giữa hai mốc bullet liên tiếp (và hai đầu scene) mà không có gì hiện ra.
  const cues = [...(entry.cues ?? [])].sort((a, b) => a - b);
  const marks = [0, ...cues, durMs];
  const dead: [number, number][] = [];
  for (let k = 0; k < marks.length - 1; k++) {
    if (marks[k + 1] - marks[k] > DEAD_MS) dead.push([marks[k], marks[k + 1]]);
  }
  const canChange = totalMs >= MIN_SCENE_FOR_CHANGE_MS;
  const covered = dead.filter(([a, b]) =>
    timeline.slice(1).some((step) => step.atMs > a && step.atMs < b),
  );
  if (canChange) {
    deadTotal += dead.length;
    deadCovered += covered.length;
  }

  const steps = timeline.map((s) => `${s.pose}@${sec(s.atMs)}`).join(" → ");
  const warn = canChange && dead.length > covered.length ? "  ← còn khoảng chết" : "";
  console.log(`${scene.id.padEnd(8)}${scene.type.padEnd(9)}${sec(totalMs).padStart(6)}  ${steps}${warn}`);
  if (canChange) {
    for (const [a, b] of dead) {
      const ok = covered.some(([x]) => x === a);
      if (!ok) console.log(`${" ".repeat(23)}đứng im ${sec(a)}→${sec(b)} (${((b - a) / 1000).toFixed(0)}s)`);
    }
  }
}

console.log(
  `\n${scenes} scene · ${(changes / Math.max(scenes, 1)).toFixed(2)} lần đổi tư thế mỗi scene` +
    ` · dùng ${poseUse.size} tư thế khác nhau`,
);
console.log(
  `khoảng chết >${DEAD_MS / 1000}s: ${deadCovered}/${deadTotal} đã được lấp bằng một lần đổi tư thế`,
);
if (deadTotal > deadCovered) {
  console.log(
    `\nChỗ còn đứng im thì thêm một tag cảm xúc nghe được vào giữa quãng đó` +
      ` (<gasp> <cheer> <chuckle> <sigh> <groan> <tsk> <throat-clearing>),` +
      `\nhoặc khai báo "poses": [{ "after": "cụm từ", "pose": "..." }] trong scene.`,
  );
}
