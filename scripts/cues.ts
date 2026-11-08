import type { Word } from "../src/types.ts";

/**
 * Tìm mốc thời gian để hiện từng bullet / từng bước sơ đồ, lấy thẳng từ timing lời nói.
 *
 * Trước đây animation chạy theo lịch chia đều cho thời lượng scene, nên bullet hiện
 * ra trước lúc người giảng nói tới nó vài giây. Ở đây mỗi dòng được gắn vào đúng chỗ
 * trong câu nói: tìm trong luồng chữ vị trí sớm nhất chứa các từ đặc trưng của dòng đó.
 */

const STOP = new Set([
  "là", "và", "của", "cho", "với", "một", "các", "những", "này", "đó", "thì", "mà", "như",
  "khi", "nếu", "để", "có", "không", "được", "trong", "ngoài", "từ", "theo", "bằng", "nên",
  "rất", "cũng", "đã", "sẽ", "đang", "bị", "hay", "hoặc", "vì", "nhưng", "còn", "ra", "vào",
  "lên", "xuống", "tại", "trên", "dưới", "sau", "trước", "đều", "chỉ", "cả", "mỗi", "nào",
]);

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]/gu, "");

const keyTokens = (text: string) =>
  text
    .split(/\s+/)
    .map(norm)
    .filter((t) => t.length > 1 && !STOP.has(t));

/**
 * Neo vào đúng từ đầu tiên của dòng được nói ra, không phải đầu cửa sổ tìm kiếm.
 * Quét từ `start`: gặp một từ đặc trưng thì kiểm tra cửa sổ phía sau có đủ số từ
 * đặc trưng khác không — đủ thì chính từ đó là mốc.
 */
const findAnchor = (words: Word[], tokens: string[], start: number, windowSize = 10) => {
  if (tokens.length === 0) return -1;
  const need = tokens.length <= 2 ? 1 : 2;
  const set = new Set(tokens);

  for (let j = start; j < words.length; j++) {
    const here = norm(words[j].text);
    if (!set.has(here)) continue;

    const seen = new Set<string>([here]);
    for (let k = j + 1; k < Math.min(j + windowSize, words.length); k++) {
      const w = norm(words[k].text);
      if (set.has(w)) seen.add(w);
    }
    if (seen.size >= need) return j;
  }
  // Khớp yếu thì thà không khớp: trả -1 để nội suy giữa hai mốc chắc chắn,
  // còn hơn nhảy tới một chỗ trùng từ ngẫu nhiên ở cuối câu.
  return -1;
};

/** Khớp một cụm từ khoá do người viết script chỉ định (scene.cues). */
const findPhrase = (words: Word[], phrase: string, start: number) => {
  const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
  if (!toks.length) return -1;
  for (let j = start; j <= words.length - toks.length; j++) {
    let ok = true;
    for (let k = 0; k < toks.length; k++) {
      if (norm(words[j + k].text) !== toks[k]) {
        ok = false;
        break;
      }
    }
    if (ok) return j;
  }
  return -1;
};

/**
 * @param labels   nội dung từng dòng (bullet) — dùng để tự dò
 * @param explicit từ khoá do script chỉ định, ưu tiên hơn tự dò
 */
export const resolveCues = (
  words: Word[] | undefined,
  labels: string[],
  explicit?: string[],
  durationMs?: number,
): number[] => {
  const count = Math.max(labels.length, explicit?.length ?? 0);
  if (count === 0) return [];

  // Không có timing thì chia đều — vẫn chạy được, chỉ là không khớp lời
  if (!words || words.length === 0) {
    const span = (durationMs ?? 0) * 0.62;
    return Array.from({ length: count }, (_, i) => Math.round((span / count) * i));
  }

  const found: (number | null)[] = [];
  let cursor = 0;

  for (let i = 0; i < count; i++) {
    const phrase = explicit?.[i];
    // Từ khoá khai báo tay: tìm từ mốc trước, không thấy thì tìm lại từ đầu —
    // tác giả đã chỉ đích danh thì tin, kể cả khi nó nằm lệch thứ tự.
    let idx = phrase ? findPhrase(words, phrase, cursor) : -1;
    if (idx < 0 && phrase) idx = findPhrase(words, phrase, 0);
    if (idx < 0) idx = findAnchor(words, keyTokens(labels[i] ?? phrase ?? ""), cursor);

    if (idx < 0) {
      found.push(null);
      continue;
    }
    found.push(words[idx].startMs);
    cursor = Math.min(idx + 1, words.length - 1);
  }

  // Dòng không dò được: nội suy giữa hai mốc chắc chắn gần nhất
  const last = words[words.length - 1].endMs;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    if (found[i] != null) {
      out.push(found[i] as number);
      continue;
    }
    let prevI = i - 1;
    while (prevI >= 0 && found[prevI] == null) prevI--;
    let nextI = i + 1;
    while (nextI < count && found[nextI] == null) nextI++;

    const prev = prevI >= 0 ? (found[prevI] as number) : 0;
    const next = nextI < count ? (found[nextI] as number) : last * 0.85;
    const steps = nextI - prevI;
    out.push(Math.round(prev + ((next - prev) * (i - prevI)) / Math.max(steps, 1)));
  }

  // mốc phải tăng dần
  for (let i = 1; i < out.length; i++) {
    if (out[i] <= out[i - 1]) out[i] = out[i - 1] + 600;
  }
  return out.map((ms) => Math.max(0, Math.round(ms)));
};
