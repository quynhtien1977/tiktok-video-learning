# AGENTS.md

Hướng dẫn cho AI agent làm việc trên repo này. Đọc file này trước, nó rất ngắn và chỉ đường
sang chỗ cần đọc tiếp.

## Dự án là gì

Loạt video giảng **Software Engineering** (Sommerville 10e) bằng tiếng Việt, dựng bằng
Remotion. Đang làm Chapter 18: 6 tập, xuất hai khổ — 16:9 cho YouTube và 9:16 cắt ba phần
cho TikTok.

```
docs/*.pptx → content/epNN.json → public/voice/epNN/*.mp3 + manifest.json → out/
  (slide)      (script, agent viết)   (Gemini TTS + align + sync + retime)   (Remotion)
```

## Đọc theo thứ tự này

| File | Nội dung |
|---|---|
| **`HANDOFF.md`** | **Đọc đầu tiên.** Dự án đang ở đâu, việc gì đã xong, việc gì đang dở, và một mục riêng ghi lại **mọi thứ đã đo được** để không phải thử lại từ đầu. |
| `CLAUDE.md` | Cẩm nang vận hành: cách viết script, quy tắc ngôn ngữ, dây chuyền giọng đọc, nhân vật, tư thế, hiệu ứng âm thanh, cách cắt phần cho TikTok. |
| `NHAN-VAT.md` | Sprite nhân vật: hiện trạng, hai vấn đề đã biết, cách sinh thêm tư thế. |
| `TIKTOK.md` | Caption, hashtag và thứ tự đăng cho 18 video dọc. |
| `DESIGN.md` | Bảng màu và lý do chọn. |

Mục **"Những điều đã đo được"** trong `HANDOFF.md` là phần giá trị nhất — mỗi dòng ở đó là
một vòng thử sai đã tốn thời gian thật.

## Quy tắc cứng

- **Tiếng Việt cho lời thoại và tài liệu, giữ nguyên thuật ngữ tiếng Anh** (service, SOA,
  WSDL, late binding…). Viết liền thuật ngữ: `WSDL` chứ không `W S D L` — đã test, viết
  tách chữ làm TTS đọc sai hoàn toàn.
- **Chạy `npx tsc` và `npm run lint` trước khi báo xong.**
- **Đúng thứ tự khi đổi lời thoại**: `voice:gemini` → `align_stt` → `sync` → `retime` →
  `sync` → `cues` → `poses`. Chạy `retime` trước `sync` là nó tính trên số cũ rồi chết
  giữa chừng.
- **Đo trước khi sửa.** Gần như mọi vấn đề trong dự án này được giải quyết bằng một phép đo,
  không phải bằng phỏng đoán. Có lệnh sẵn cho việc đó: `npm run cues`, `npm run poses`.
- **Làm một tập mẫu rồi mới nhân ra sáu tập.** Chủ dự án duyệt bằng cách xem và nghe thật.

## Đừng đụng vào

| Đường dẫn | Vì sao |
|---|---|
| `public/characters/`, `char_reference/` | Sprite nhân vật và ảnh gốc. Gitignore, **không sinh lại được bằng code**. Mất là mất. |
| `.env` | Khoá API. |
| `manifest.json`, `*.words.json` | Script sinh ra. Sửa tay là hỏng đồng bộ. |
| `vendor/` | Code ngoài. Chạy Python với `-I`. |
| `docs/*.pptx` | Slide có bản quyền, không commit. |
| `capcut/` | 307MB video tham chiếu. Gitignore. Hỏi chủ dự án trước khi xoá. |

## Lệnh hay dùng

```bash
npm run quota                      # còn bao nhiêu lượt Gemini hôm nay
npm run voice:gemini -- --ep ep01 --only s01,s02 --force --free
npm run sync   -- --ep ep01        # manifest + mốc animation + chuẩn âm lượng
npm run retime -- --ep ep01 --target 19.0 --per-scene
npm run cues   -- --ep ep01        # mốc animation có bám lời nói không
npm run poses  -- --ep ep01        # tư thế nhân vật và "khoảng chết"
npm run sprites                    # căn khung lại cho sprite
npm run sfx:ui                     # sinh lại bộ hiệu ứng âm thanh
npm run render:all                 # render trọn bộ
npm run dev                        # Remotion Studio
```

---

## RTK — tuỳ chọn, được phép dùng

RTK là lớp bọc CLI nén đầu ra lệnh để tốn ít token hơn. Đã cài sẵn trên máy chủ dự án
(`rtk 1.1.0`), **không bắt buộc** — mọi lệnh ở trên chạy được ở dạng gốc.

> **Antigravity**: trước khi dùng RTK, đọc **`.agents/rules/antigravity-rtk-rules.md`**.
> File đó có cách dùng, chỗ nào đáng dùng, và hai cái bẫy đã gặp.

Tóm tắt một dòng: `rtk <lệnh>` để nén, `rtk proxy <lệnh>` khi cần đầu ra đầy đủ. Đừng nén
khi đang chẩn đoán lỗi — RTK từng nuốt mất tên file và số dòng trong báo lỗi lint.

## CodeGraph — repo này KHÔNG có, và không cần

Không có thư mục `.codegraph/`. Đừng chạy lệnh codegraph nào, chúng sẽ không có gì để đọc.

Lý do không index: toàn bộ mã nguồn là **32 file / 5.907 dòng**, file lớn nhất 749 dòng.
CodeGraph đáng giá khi repo lớn tới mức phải grep rồi đọc lần mò; ở quy mô này thì đọc thẳng
file còn nhanh hơn, và `CLAUDE.md` đã nói sẵn file nào làm gì.

**Khi nào nên xem lại**: loạt bài này dự kiến mở rộng sang nhiều chương. Nếu `src/` vượt quá
khoảng 15.000 dòng, hoặc `src/diagrams/index.tsx` tách thành vài chục component, thì chạy
`codegraph init` ở gốc repo rồi thêm một dòng vào mục này.

Nếu về sau có ai index thật thì quy ước là: **ưu tiên `codegraph explore "<câu hỏi>"` trước
khi grep hay đọc file**, vì nó trả về mã nguồn của đúng các symbol liên quan kèm đường gọi
giữa chúng, trong một lượt.

## Bản đồ thư mục

```
content/epNN.json        script từng tập — nguồn duy nhất cho giọng đọc và phụ đề
src/
  Episode.tsx            dựng timeline từ manifest, gắn hiệu ứng âm thanh
  poses.ts               chọn tư thế nhân vật theo nội dung lời thoại
  theme.ts               màu, font, useLayout() cho hai khổ hình
  components/            Frame, Captions, SpeakerBadge
  scenes/index.tsx       10 kiểu scene: title, bullets, diagram, question, hook, endcard…
  diagrams/index.tsx     sơ đồ vẽ bằng code, có bản riêng cho khổ dọc
scripts/                 dây chuyền giọng đọc, đo đạc, render — đọc phần đầu mỗi file
public/voice/epNN/       mp3 + manifest.json + words.json (script sinh ra)
public/characters/       sprite nhân vật (gitignore)
public/sfx/ui/           hiệu ứng âm thanh (sinh bằng npm run sfx:ui)
out/                     video render ra (gitignore)
```
