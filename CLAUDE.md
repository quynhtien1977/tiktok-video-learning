# Pipeline video giải thích lý thuyết (nhiều tập)

Nội dung: slide môn Software Engineering (Sommerville 10e) trong `docs/`.
Dàn ý cả loạt + thứ tự tập: xem `OUTLINE.md`. **Đang làm Chapter 18 trước.**

```
docs/<slide .pptx>  →  content/epNN.json  →  public/voice/epNN/*.mp3 + manifest.json  →  out/epNN.mp4
     (Claude đọc)        (script, Claude viết)     (CapCut API hoặc Azure TTS)            (Remotion render)
```

## 1. Tài liệu nguồn
Đọc .pptx bằng `python-pptx` (đã cài). Dump text:
`python -I -X utf8 scripts/pptx_dump.py "docs/Ch18 ....pptx"`

## 2. Viết script tập (Claude làm)
Tạo/sửa `content/epNN.json` theo `src/types.ts`. Quy tắc:

**Ngôn ngữ** — giảng cho người Việt:
- Lời thoại tiếng Việt, **giữ nguyên thuật ngữ tiếng Anh**: service, web service, SOA, SOAP, WSDL,
  WS-BPEL, REST, resource, endpoint, binding, workflow, late binding, loosely coupled,
  utility / business / coordination service, task- và entity-oriented.
- Lần đầu xuất hiện: nói thuật ngữ rồi thêm một câu giải nghĩa tiếng Việt. Lần sau dùng thẳng.
- **Viết liền thuật ngữ** (`WSDL`, `SOAP`, `REST`, `API`). Đã test: viết tách chữ (`W S D L`)
  làm TTS đọc sai hoàn toàn ("S O anh P", "một mười m l"). Không bao giờ tách chữ.
- Không ký hiệu toán trong `narration` (viết "căn n", không viết "√n").

**Hai giọng (host / ask)**:
- `episode.voices = { host: {...}, ask: {...} }`, scene ghi `"speaker": "ask"` để đổi sang giọng hỏi.
- Thứ tự ưu tiên: `scene.voice` > `episode.voices[scene.speaker]` > `episode.voice`.
- Scene của vai `ask` tự đổi màu nền + viền trái (xem `src/components/Frame.tsx`), và thường dùng
  `type: "question"`. Mỗi 2–3 phút chèn một câu hỏi để chia nhịp, đừng lạm dụng.

**Cấu trúc**:
- `narration` là nguồn duy nhất cho cả giọng đọc lẫn phụ đề — văn nói, câu dưới 25 từ.
- Mỗi scene một ý, 15–45 giây thoại. Một tập 8–12 phút ≈ 12–20 scene.
- Chỉ dùng `type` đã có: title, bullets, formula, image, **diagram**, quote, question, outro.
  Cần kiểu mới thì thêm vào `src/types.ts` + `src/scenes/index.tsx`, đừng nhét HTML vào JSON.
- Ưu tiên `diagram` (vẽ bằng code, dựng dần theo lời giảng) hơn `image` (ảnh trích từ slide).
  **Hai loại sơ đồ có hai cách trình bày, cố ý khác nhau:**
  `diagram` vẽ lại theo bảng màu của loạt bài, có bóng đổ, nổi lên khỏi giấy.
  `image` là **trích dẫn nguyên bản từ giáo trình** — giữ nguyên màu xanh cyan và kiểu chữ của
  slide, nằm phẳng trên giấy (không bóng, không card, nền trắng bị khử bằng `mix-blend-mode`).
  Giữ nguyên bản vì người học phải nhận ra đúng hình đó khi mở lại slide lúc ôn thi.
  Scene `image` **bắt buộc có `caption` ghi rõ nguồn** (ví dụ "Hình trong slide 13").
  Sơ đồ có sẵn trong `src/diagrams/index.tsx`: `soa-triangle`, `in-car-system`, `rest-verbs`.
  Sơ đồ mới thì thêm một component vào file đó rồi đăng ký trong `diagrams`.
- Chữ trên màn hình là tóm tắt, không chép lại lời thoại (phụ đề đã lo). Tối đa 4 bullet/scene.
- **Bullet phải dùng lại từ khoá có trong `narration`** (ví dụ bullet "Late binding — chọn lúc
  chạy" thì lời thoại cũng phải nói "late binding"). `npm run sync` dò từ khoá đó trong timing
  lời nói để biết lúc nào hiện bullet. Dòng nào không dò được sẽ bị nội suy, nhìn sẽ lệch.
  Lệnh sync in ra mốc của từng dòng — nhìn vào đó kiểm tra ngay.
- Scene `diagram` muốn khớp từng bước thì khai báo `"cues": ["từ khoá bước 1", "bước 2", ...]`
  theo đúng thứ tự các bước của component sơ đồ.
- Thêm tập mới: tạo `content/epNN.json` **và** thêm 1 dòng import trong `src/Root.tsx`.

## 3. Giọng đọc

Ba nhà cung cấp: `"voice": {"provider": "gemini" | "azure" | "capcut", ...}`.
**Chapter 18 đang dùng Gemini cho cả giọng giảng lẫn giọng hỏi.**

**Gemini (đang dùng)** — engine duy nhất phát được tiếng cười giữa câu:
```
npm run quota                               # còn bao nhiêu lượt miễn phí hôm nay
npm run voice:gemini -- --ep ep01           # free trước, hết thì tràn sang Beeknoee
npm run voice:gemini -- --ep ep01 --free    # chỉ dùng key free, hết thì dừng (không lẫn model)
python -I scripts/align_stt.py --ep ep01    # BẮT BUỘC, Gemini không trả word boundary
```
- Giọng: `achird` (nam, ấm) cho host, `aoede` (nữ) cho vai hỏi.
- `style` nhận **tiếng Anh tự nhiên**: `"clear and friendly teacher, brisk confident pace"`.
- Tag chèn giữa câu: `<laugh>`, `<sigh>`, `<gasp>`, `<breath>`, `<short pause>`.
  Chúng bị lọc khỏi phụ đề và khỏi từ khoá dò mốc, nên cứ viết thẳng vào `narration`.
- **Hai tầng key khác model**: key trực tiếp chạy `gemini-3.8-flash-tts` (free ~10 lượt/ngày/key,
  có `style`); key Beeknoee chạy `3.1-flash-tts-preview` (trả tiền, **gateway nuốt mất `style`**
  nên đọc chậm hơn). Đừng để một tập lẫn hai tầng — dùng `--free` hoặc `--paid` để ép một tầng.
- Nhịp đọc giữa hai tầng lệch nhau nhiều. Sau khi sinh, **luôn đo lại và kéo về cùng nhịp**:
  `npm run retime -- --ep epNN --target 19.0` (19,0 ký tự/giây là nhịp chuẩn của loạt này).
  Lệnh này sửa cả mp3 lẫn timing phụ đề, không gọi API.



**Azure (chất lượng cao nhất)** — dòng MAI-Voice, cần `AZURE_SPEECH_KEY` trong `.env`:
```
npm run voice -- --ep ep01
python -I scripts/align_stt.py --ep ep01     # BẮT BUỘC: MAI-Voice không trả word boundary
```
- `vi-VN-Grant:MAI-Voice-2.1` (nam) — style: `educational`, `narrator`, `neutral`, `agent`, `customer_call_center`
- `vi-VN-Harper:MAI-Voice-2.1` (nữ) — style: `audiobook`, `neutral`
- `vi-VN-NamMinhNeural` / `vi-VN-HoaiMyNeural` (neural đời cũ) — **có** word boundary, không cần align.
- Chạy được từ region `koreacentral` (đã kiểm chứng) dù docs không liệt kê.
- Azure MAI ăn `rate` **nhưng `<prosody>` phải nằm trong `<mstts:express-as>`** — đo thực tế:
  đặt ngoài 7,49s → 6,77s, đặt trong → 5,86s. Script đã làm đúng; dùng `"rate": "+18%"`.
- `<emphasis>` bị MAI bỏ qua (thời lượng không đổi), `<break>` gần như không ăn. Muốn nhấn thì
  viết lại câu, đừng trông vào SSML.
- vi-VN-Grant chỉ nhận 5 style: `educational`, `narrator`, `neutral`, `agent`,
  `customer_call_center`. Thử `cheerful`/`excited`/`friendly`/`chat` đều bị trả lỗi.
  Đổi style theo vai scene cho đỡ đều đều: giảng dùng `educational`, kể ví dụ dùng `narrator`.
- **Không engine nào ở đây hiểu audio tag kiểu ElevenLabs.** Đã đo cụ thể:
  Azure đọc `[laughs]` thành chữ "laughs" (+0,67s đúng bằng thời gian đọc từ đó);
  CapCut ngoặc vuông cũng đọc thành chữ; CapCut ngoặc tròn `(haha)` thì bỏ nội dung
  nhưng chỉ thêm ~220ms — `()` rỗng cũng thêm đúng 220ms, tức đó chỉ là khoảng lặng.
  → Muốn có tiếng cười: dùng file âm thanh thật, chèn bằng `npm run sfx` (xem `public/sfx/`).
  Hoặc đổi hẳn sang ElevenLabs v3 (~6 đô/tháng) nếu muốn tag inline.
- Script TTS tự cắt khoảng lặng thừa đầu/cuối mỗi scene (`silenceremove`), đừng cắt tay.

**CapCut (miễn phí, không cần tài khoản)**:
```
npm run voices:capcut                       # 24 giọng vi-VN
npm run voice:capcut -- --ep ep01           # kèm luôn timing từng chữ
```
- Nam: `BV075_streaming`, `multi_male_felipe_uranus_bigtts`, `BV560_streaming`.
- **CapCut bỏ qua toàn bộ SSML**: `rate`, `pitch`, `volume` vô tác dụng (đã đo bằng md5).
  Núm duy nhất có tác dụng là `emotion` + `emotionScale` (1–5):
  `neutral · narrator · narration · storytelling · customer_service · happy · excited · calm · serious · radio · advertising`.
  Thử nghe: `python -I scripts/emotion_lab.py`.
- `vi-VN-NamMinhNeural` có trong catalog CapCut nhưng trả `TTSInvalidSpeaker` — đừng dùng.

**Chỉnh nhịp đọc**: `"speed": 1.15` trong voice (mọi provider) — hậu kỳ bằng `ffmpeg atempo`,
không đổi cao độ, và timing phụ đề được co giãn theo tự động.

**Thủ công (dự phòng cuối)** — `npm run capcut` xuất text dán tay, `npm run split` cắt theo khoảng lặng.

**Nghe thử giọng**: `python -I scripts/voice_lab.py` → `out/voice-lab/index.html`
(lấy mẫu mọi giọng của một ngôn ngữ, mở bằng trình duyệt để so sánh).

## 2b. Cắt phần cho TikTok
Đánh dấu `"part": 1 | 2 | 3` trên từng scene. Root tự sinh thêm composition dọc 1080×1920
cho mỗi phần: `ep01-v-p1`, `ep01-v-p2`, … Bản 16:9 đầy đủ vẫn là `ep01`.
Mỗi phần nên dài 2–3 phút, mở bằng một scene tự đứng được (title hoặc question),
và kết bằng một ý trọn vẹn — người xem TikTok vào giữa chừng vẫn hiểu.
Bố cục tự co theo khung qua `useLayout()` trong `src/theme.ts`; sơ đồ có bản vẽ riêng cho khổ dọc.

```
npm run render -- ep01       out/ep01.mp4          # 16:9
npm run render -- ep01-v-p1  out/tiktok/p1.mp4     # 9:16
```

## 3b. Sơ đồ từ slide
Sơ đồ trong slide Sommerville là EMF (vector) nên trích ra PNG 3x vẫn nét:
```
powershell -ExecutionPolicy Bypass -File scripts/extract-slide-images.ps1 `
  -Pptx "docs/Ch18 Service-oriented software engineering.pptx" -Out "public/images/ch18"
```
Tên file ra: `slide08-image2.png` (biết ngay thuộc slide nào). Dùng bằng scene
`{ "type": "image", "src": "images/ch18/slide13-image3.png" }` — scene image tự đặt sơ đồ
trên card trắng nên nền trắng của slide không chọi với theme tối.

## 3c. Tiếng cười / thở dài (tuỳ chọn)
Khai báo trong scene rồi chạy **trước** `sync`:
```
"inserts": [{ "after": "rất", "file": "sfx/cuoi-nhe.mp3", "gainDb": -2 }]
npm run sfx -- --ep ep01
```
Clip được cắm ngay sau từ `after`, và timing phụ đề phía sau tự dời theo nên vẫn khớp.
File nguồn để trong `public/sfx/` — tự thu bằng điện thoại, tiếng người thật nghe hơn hẳn.

## 4. Đồng bộ timing (BẮT BUỘC sau mỗi lần đổi audio)
```
npm run sync -- --ep ep01     # sinh manifest + mốc animation + chuẩn hoá âm lượng -16 LUFS
npm run cues -- --ep ep01     # soi từng mốc: dòng nào hiện lúc giọng đang nói gì
```
`npm run cues` phải in "Tất cả mốc đều bám lời nói" trước khi render. Dòng nào báo
"nội suy" hoặc "THIẾU" là chỗ chữ sẽ hiện lệch với lời nói — sửa bằng cách cho bullet
dùng lại từ khoá trong lời thoại, hoặc khai báo `"cues": [...]` chỉ đích danh.

Sinh `public/voice/ep01/manifest.json`. Remotion lấy độ dài scene từ file này —
**không bao giờ hardcode durationInFrames trong component.**

## 5. Xem trước và render
```
npm run dev                                   # Remotion Studio
npm run still -- ep01 out/check.png --frame=900
npm run render -- ep01 out/ep01.mp4 --concurrency=4
```

## Quy ước
- Audio trong `public/voice/<ep>/`, ảnh trong `public/images/`.
- Không sửa tay `manifest.json` và `*.words.json` (script sinh ra).
- Đổi màu/font ở `src/theme.ts`, không rải style cứng trong scene. Bảng màu và lý do chọn:
  `DESIGN.md`; hợp đồng hướng thiết kế: `.impeccable/surfaces/src-episode-tsx.md`.
- Mọi cỡ chữ và lề đi qua `useLayout()` để bản dọc tự co, đừng viết px cố định.
- `vendor/` là code ngoài, không commit, không sửa — chạy Python với `-I`.
- `content/ep00.json` là tập test giọng, giữ lại để thử giọng mới.
- Chạy `npx tsc` trước khi báo xong.
