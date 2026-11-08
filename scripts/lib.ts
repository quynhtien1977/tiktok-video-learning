import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export type Json = Record<string, unknown>;

export const root = process.cwd();

export const loadEpisode = (episodeId: string) => {
  const file = path.join(root, "content", `${episodeId}.json`);
  if (!existsSync(file)) {
    throw new Error(`Không tìm thấy ${file}`);
  }
  return JSON.parse(readFileSync(file, "utf-8"));
};

/** Thời lượng audio (giây) bằng ffprobe — chính xác hơn mọi cách ước lượng. */
export const probeDuration = (file: string): number => {
  const out = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ],
    { encoding: "utf-8" },
  );
  const n = Number(out.trim());
  if (!isFinite(n)) throw new Error(`ffprobe không đọc được thời lượng: ${file}`);
  return n;
};

export const voiceDir = (episodeId: string) =>
  path.join(root, "public", "voice", episodeId);

export const argOf = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) {
    return process.argv[i + 1];
  }
  return fallback;
};

export const hasFlag = (name: string) => process.argv.includes(`--${name}`);
