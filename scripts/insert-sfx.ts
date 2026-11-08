/**
 * Chèn tiếng phi lời nói (cười, thở dài, hừm) vào GIỮA câu đã tổng hợp.
 *
 *   node scripts/insert-sfx.ts --ep ep01
 *
 * Vì sao cần: Azure MAI và CapCut đều KHÔNG hiểu audio tag kiểu ElevenLabs — viết
 * "[laughs]" thì chúng đọc thành chữ "laughs" (đã đo: +0.67s đúng bằng thời gian đọc từ đó).
 * Nên tiếng cười phải là một file âm thanh thật, cắm vào đúng vị trí trong clip.
 *
 * Cách dùng trong content/epNN.json:
 *   "inserts": [{ "after": "rất", "file": "sfx/cuoi-nhe.mp3", "gainDb": -2, "overlap": 0.12 }]
 *
 * `after` là từ trong narration; clip được chèn ngay sau khi từ đó dứt. Timing phụ đề
 * của mọi chữ phía sau được dời đi đúng bằng độ dài clip, nên phụ đề vẫn khớp.
 *
 * Chạy SAU align_stt (cần words.json) và TRƯỚC sync (sync sẽ tính lại mốc animation).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import path from "node:path";
import { argOf, hasFlag, loadEpisode, probeDuration, root, voiceDir } from "./lib.ts";
import type { Word } from "../src/types.ts";

type Insert = { after: string; file: string; gainDb?: number; overlap?: number };

const episodeId = argOf("ep", "ep01")!;
const only = argOf("only");
const force = hasFlag("force");

const episode = loadEpisode(episodeId);
const dir = voiceDir(episodeId);

const norm = (t: string) => t.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "");

let done = 0;

for (const scene of episode.scenes) {
  if (only && scene.id !== only) continue;
  const inserts: Insert[] | undefined = scene.inserts;
  if (!inserts?.length) continue;

  const mp3 = path.join(dir, `${scene.id}.mp3`);
  const wordsFile = path.join(dir, `${scene.id}.words.json`);
  const marker = path.join(dir, `${scene.id}.sfx`);

  if (!existsSync(mp3) || !existsSync(wordsFile)) {
    console.log(`· ${scene.id}: thiếu audio hoặc timing, bỏ qua`);
    continue;
  }
  if (existsSync(marker) && !force) {
    console.log(`· ${scene.id}: đã chèn rồi, bỏ qua (--force để làm lại)`);
    continue;
  }

  let words: Word[] = JSON.parse(readFileSync(wordsFile, "utf-8"));

  // Chèn từ cuối về đầu để các mốc phía trước không bị xê dịch giữa chừng
  const ordered = inserts
    .map((ins) => {
      const idx = words.findIndex((w) => norm(w.text) === norm(ins.after));
      return { ins, idx };
    })
    .filter((x) => x.idx >= 0)
    .sort((a, b) => b.idx - a.idx);

  const missing = inserts.length - ordered.length;
  if (missing > 0) {
    console.log(`· ${scene.id}: ${missing} chỗ không tìm thấy từ "after" trong lời thoại`);
  }
  if (!ordered.length) continue;

  for (const { ins, idx } of ordered) {
    const sfx = path.join(root, "public", ins.file);
    if (!existsSync(sfx)) {
      console.log(`· ${scene.id}: không có ${ins.file}`);
      continue;
    }

    const cutSec = words[idx].endMs / 1000;
    const overlap = ins.overlap ?? 0.1; // lấn nhẹ vào cuối từ cho đỡ khựng
    const at = Math.max(0, cutSec - overlap);
    const sfxDur = probeDuration(sfx);
    const gain = ins.gainDb ?? 0;

    const head = mp3.replace(/\.mp3$/, ".head.mp3");
    const tail = mp3.replace(/\.mp3$/, ".tail.mp3");
    const piece = mp3.replace(/\.mp3$/, ".piece.mp3");
    const joined = mp3.replace(/\.mp3$/, ".joined.mp3");
    const listFile = mp3.replace(/\.mp3$/, ".list.txt");

    const ff = (args: string[]) =>
      execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args]);

    ff(["-i", mp3, "-t", String(at), "-c:a", "libmp3lame", "-b:a", "128k", head]);
    ff(["-i", mp3, "-ss", String(at), "-c:a", "libmp3lame", "-b:a", "128k", tail]);
    ff([
      "-i", sfx,
      "-af", `volume=${gain}dB,afade=t=in:d=0.04,afade=t=out:st=${Math.max(0, sfxDur - 0.06)}:d=0.06`,
      "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", piece,
    ]);
    writeFileSync(
      listFile,
      [head, piece, tail].map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"),
      "utf-8",
    );
    ff(["-f", "concat", "-safe", "0", "-i", listFile, "-c:a", "libmp3lame", "-b:a", "128k", joined]);
    renameSync(joined, mp3);
    for (const f of [head, tail, piece, listFile]) {
      try {
        unlinkSync(f);
      } catch {
        /* dọn dẹp, lỗi thì kệ */
      }
    }

    // Dời timing của mọi chữ sau điểm chèn
    const shiftMs = Math.round((sfxDur - overlap) * 1000);
    words = words.map((w, i) =>
      i > idx ? { text: w.text, startMs: w.startMs + shiftMs, endMs: w.endMs + shiftMs } : w,
    );
    console.log(
      `· ${scene.id}: chèn ${ins.file} sau "${ins.after}" tại ${at.toFixed(2)}s (+${shiftMs}ms)`,
    );
    done++;
  }

  writeFileSync(wordsFile, JSON.stringify(words, null, 2), "utf-8");
  writeFileSync(marker, "inserted", "utf-8");
}

console.log(
  done === 0
    ? "\nKhông có chỗ nào để chèn (scene chưa khai báo `inserts`)."
    : `\nĐã chèn ${done} chỗ. Tiếp theo: npm run sync -- --ep ${episodeId}`,
);
