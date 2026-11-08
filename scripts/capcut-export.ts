/**
 * Xuất lời thoại ra file text để dán vào CapCut (Đọc văn bản / Text-to-speech).
 *
 *   node scripts/capcut-export.ts --ep ep01
 *
 * CapCut không có API công khai => bước tạo giọng là thủ công, nhưng tên file
 * và thứ tự thì cố định, nên pipeline vẫn tự động hoá được phần còn lại.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { argOf, loadEpisode, root } from "./lib.ts";

const episodeId = argOf("ep", "ep01")!;
const episode = loadEpisode(episodeId);
const outDir = path.join(root, "capcut");
mkdirSync(outDir, { recursive: true });

const blocks = episode.scenes.map(
  (s: { id: string; narration: string }, i: number) =>
    `### ${i + 1}. ${s.id}  ->  public/voice/${episodeId}/${s.id}.mp3\n${s.narration}\n`,
);

writeFileSync(
  path.join(outDir, `${episodeId}.txt`),
  `# ${episode.seriesTitle} — Tập ${episode.episodeNumber}: ${episode.title}
# Cách dùng:
#   A. Mỗi scene một lần: dán phần thoại của scene vào CapCut -> tạo giọng đọc
#      -> xuất audio -> lưu đúng tên file ghi ở tiêu đề scene.
#   B. Đọc liền một mạch: dán toàn bộ (bỏ các dòng ###), xuất 1 file audio,
#      rồi chạy: node scripts/capcut-split.ts --ep ${episodeId} --in <file>
#      (tự cắt theo khoảng lặng giữa các scene — nhớ ngắt dòng trống giữa các scene).
#   Sau đó luôn chạy: npm run sync -- --ep ${episodeId}

${blocks.join("\n")}`,
  "utf-8",
);

console.log(`Đã ghi capcut/${episodeId}.txt (${episode.scenes.length} scene)`);
