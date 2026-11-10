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
- **Tag chèn giữa câu — Gemini nhận 38 loại, không phải 5.** Viết thẳng vào `narration`,
  chúng bị lọc khỏi phụ đề và khỏi từ khoá dò mốc. Luôn dùng **tag tiếng Anh** kể cả khi
  lời thoại tiếng Việt (docs Gemini nói rõ vậy). Những cái hợp loạt bài này:

  | Nhóm | Tag | Dùng lúc |
  |---|---|---|
  | vui | `<laugh>` `<chuckle>` `<giggle>` `<snicker>` `<cheer>` | câu đùa, chốt khoái |
  | ngán, bực | `<sigh>` `<groan>` `<tsk>` `<pff>` `<yawn>` | chê SOAP dài dòng, XML rườm |
  | bất ngờ | `<gasp>` | câu lật ngược, con số gây sốc |
  | lấy hơi | `<breath>` `<heavy breath>` `<exhales>` | trước một ý nặng |
  | vào việc | `<throat-clearing>` | chuyển từ đùa sang nghiêm túc |
  | ~~nói nhỏ~~ | ~~`<whispers>`~~ | **đừng dùng — đã nghe thử, người xem không nghe ra gì** |
  | ngắt nhịp | `<short pause>` `<long pause>` | chia ý, **không phải cảm xúc** |

  Còn lại Gemini cũng nhận nhưng ít hợp: `<argh> <cry> <growl> <grunt> <grr> <hiss> <moan>
  <pant> <scream> <shout> <sob> <sneeze> <snort> <cough> <whimper>`.
- **Ưu tiên tag NGHE RA TIẾNG.** Đã nghe kiểm chứng: `<whispers>` mất hút, `<breath>` và
  `<short pause>` gần như không nhận ra. Nhóm nghe rõ: `<gasp>` `<cheer>` `<chuckle>`
  `<laugh>` `<sigh>` `<groan>` `<tsk>` `<throat-clearing>`. Giữ tỉ lệ tag nghe được trên
  60% — tập 1 từng có 29% và nghe như không có tag.
- **Đặt tag SAU dấu câu, đừng chen vào trước nó**: viết `chông chênh. <tsk>` chứ không phải
  `chông chênh <tsk>.` — tag bị lọc đi sẽ để dấu chấm đứng một mình thành một token thừa,
  lệch số từ so với `words.json` và làm mốc tư thế trượt. Kiểm nhanh: số token của
  `narration` sau khi bỏ tag phải bằng đúng số phần tử trong `<scene>.words.json`.
- Gemini cũng nhận **nhấn mạnh bằng CHỮ HOA** (`điểm RẤT quan trọng`), nhưng phụ đề lấy
  thẳng từ `narration` nên chữ hoa sẽ hiện lên màn hình — cân nhắc trước khi dùng.
- Mỗi tag cũng là **một mốc đổi tư thế nhân vật** (xem mục tư thế), nên đặt tag đúng chỗ
  thì được hai thứ một lúc: giọng có màu, và nhân vật phản ứng đúng lúc.
- **Hai tầng key khác model**: key trực tiếp chạy `gemini-3.8-flash-tts` (free ~10 lượt/ngày/key,
  có `style`); key Beeknoee chạy `3.1-flash-tts-preview` (trả tiền, **gateway nuốt mất `style`**
  nên đọc chậm hơn khoảng 18%).
- Pool hiện tại: **5 key free** (≈50 lượt/ngày) + **1 key trả tiền**. Dùng `--paid` khi thử
  nghiệm lẻ, để dành lượt free cho đợt sinh hàng loạt.
- **Tag cảm xúc chạy được ở CẢ HAI tầng** — đã nghe kiểm chứng trên cùng một scene sinh ở
  hai tầng (`out/thu-tag/`): `<chuckle>` phát ra tiếng cười khúc khích nhỏ ở cả 3.1 lẫn 3.8.
  Riêng `<short pause>` thì nghe không rõ ở cả hai.
  **Đừng kết luận chuyện này bằng máy.** Đo khoảng lặng chỉ ra 18/3,36s ở 3.8 so với
  17/3,10s ở 3.1 và 17/3,04s ở bản không tag — chênh lệch quá nhỏ, và phép đo đuôi file
  hoàn toàn không thấy tiếng cười mà tai người nghe ra. Muốn biết tag có ăn không thì nghe.
- **Hết lượt free thì cứ gen tiếp sang tầng trả tiền, không xoá làm lại** — chủ dự án đã chốt
  như vậy để tối ưu chi phí. Trộn tầng trong một tập là chấp nhận được, miễn là chạy
  `retime --per-scene` sau đó.
- Nhịp đọc **luôn phải đo lại sau khi sinh**, vì mỗi tầng đọc một nhịp:
  `npm run retime -- --ep epNN --target 19.0 --per-scene`
  19,0 ký tự/giây là nhịp chuẩn của loạt này. `--per-scene` chỉ đụng vào scene lệch quá 8%
  nên giữ được dao động tự nhiên giữa các scene. Lệnh này sửa cả mp3 lẫn timing phụ đề,
  không gọi API lần nào.
- **Mật độ tag**: nhắm một mốc cảm xúc mỗi ~18 giây, tức 25–35 tag một tập. Tập 1 hiện có
  34 tag / 9 loại. Giảng đều đều suốt 5 phút là người xem bỏ.



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
Mỗi phần nên dài 2–3 phút và kết bằng một ý trọn vẹn — người xem TikTok vào giữa chừng vẫn hiểu.

**Hook chỉ dành cho phần bị cắt ra từ giữa video gốc, tức part 2 trở đi.** Part 1 đã mở
bằng scene `title` của tập rồi, thêm hook nữa là hai cái mở đầu chồng lên nhau. Part 2 và 3
thì mở giữa dòng (bullets, diagram) nên cần một scene định hướng.

Scene `hook` phải có **hai nhịp**, thiếu nhịp nào cũng hụt:
- `hook` — câu hỏi tạo khoảng trống kiến thức.
- `promise` — xem xong thì **làm được gì**. Chỉ có câu hỏi thì người xem biết mình chưa biết,
  nhưng không biết ở lại thì được gì. Nhịp hai vào ở 42% thời lượng scene.

Scene `endcard` **phải có `narration`**, đừng để rỗng. Thẻ kết im lặng là bỏ phí đúng hai
giây quan trọng nhất cho việc kêu gọi theo dõi.
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

## 3d. Hiệu ứng âm thanh cho animation
Bộ tiếng UI sinh bằng `npm run sfx:ui` (ghi vào `public/sfx/ui/`), tắt bằng `"sfx": false` trong file tập.
Mỗi tiếng gắn vào một sự kiện **người xem nhìn thấy**, mốc lấy từ chính `cues` của animation nên
không bao giờ lệch (`SFX_LEAD_MS = 220` bù việc animation vào sớm hơn lời nói):

| Sự kiện | Tiếng | Mức trộn |
|---|---|---|
| chuyển cảnh | `whoosh` | 0,34 |
| mỗi bullet hiện ra | `pop1..4` theo thứ tự, C6 E6 G6 C7 | 0,38 |
| mỗi khối sơ đồ bật lên | `block1..4`, C5 E5 G5 C6 | 0,42 |
| scene `image` / `formula` | `block2`, một lần | 0,42 |
| scene của vai `ask` | `ask-chime` | 0,34 |
| scene `hook` | `hook-sting` | 0,62 |
| scene `endcard` | `endcard` | 0,62 |

**Bài học quan trọng, đã đo bằng phổ tần**: loa điện thoại và laptop gần như không phát gì
dưới 300Hz. Bộ tiếng đầu tiên đặt `thunk` ở 52Hz — **99,9% năng lượng dưới 120Hz** — nên đo
đỉnh -4,4dB rất to mà người xem không nghe được gì, và `pop` cũ có 92% năng lượng ở 120–300Hz
nên nghe đục. Bộ hiện tại đặt phần chính trong **800Hz – 4kHz**, chỗ loa nhỏ to nhất và tai
người nhạy nhất, cộng một tiếng tách ~2ms cho dứt khoát. **Muốn tiếng nghe rõ hơn thì đổi tần
số, đừng tăng âm lượng.** Kiểm tra lại phổ bất cứ lúc nào bằng script trong `scripts/make_sfx.py`.

Cao độ **đi lên theo thứ tự bullet** là cố ý: người xem nghe thành một câu nhạc, nhận ra ngay
"vừa thêm một ý" chứ không phải bốn tiếng giống nhau.

Đỉnh mỗi file chuẩn hoá về -1dBFS, nên các mức trộn ở trên là mức nghe thật; núm điều chỉnh
nằm ở `SFX_VOLUME` trong `src/Episode.tsx`. Đo lại mức thực tế: render một bản có sfx và một
bản `"sfx": false`, trừ hai audio bằng `amix=weights=1 -1` rồi so `ebur128`.

## 3e. Hai nhân vật của kênh

- **AN** — vai `host` (giảng), nam, áo khoác đen.
- **NỮ** — vai `ask` (hỏi), nữ, 8 bộ trang phục.

Tên hiển thị nằm ở hằng `CAST` đầu `src/components/SpeakerBadge.tsx` — đổi tên là sửa hai dòng.
Nhãn tên đang **tắt** (`theme.showSpeakerName = false`): nhân vật đã hiện hình thì nhãn là thừa.

**Nhân vật là sprite PNG chibi**, do Antigravity sinh từ ảnh người thật, nằm ở
`public/characters/muc/<tư thế>.png` và `public/characters/son/<trang phục>/<tư thế>.png`
(28 tư thế mỗi bộ, 1024×1024, nền trong suốt). Thư mục này **gitignore**, không nằm trong repo.
Bản SVG vẽ tay vẫn còn trong `SpeakerBadge.tsx` làm đường lùi, bật tắt bằng
`theme.useCharacterImages` và `theme.hasMucImages`.

**Khoá một bộ trang phục cho cả loạt.** `pickOutfit()` mặc định xoay trang phục theo part,
mà **khuôn mặt lệch giữa các bộ** (mỗi bộ sinh ở một lượt riêng: `braid-rose` mặt dài mắt
hạnh nhân, `bun-bow` mặt tròn mắt to, `maroon-tee` tóc nâu). Xoay bộ nghĩa là mỗi phần một
khuôn mặt khác. Truyền `outfit` cố định để khoá.

Hai điều đã thử và hỏng với bản SVG cũ, đừng làm lại: kính chữ nhật ở cỡ nhỏ đọc thành mặt
nạ (dùng kính tròn), và `<clipPath>` khai báo bên trong `<g clipPath=...>` thì không ăn.

### Tư thế nhân vật — một tư thế cho cả scene

`resolveCharacterPose()` trong **`src/poses.ts`** chọn tư thế nền cho mỗi scene, đọc ra từ `narration`. Muốn chỉ định cứng thì đặt `"pose"` trong scene, luôn thắng.

**Một scene được đổi tối đa 3 tư thế, nhưng mốc đổi phải neo vào lời nói**, không theo
tiến độ frame. `resolvePoseTimeline()` dựng lịch theo ba tầng, tầng trên thắng tầng dưới:

1. `"poses"` khai báo tay trong scene — `[{ "after": "ví dụ", "pose": "ok" }]`. Mốc lấy từ
   đúng lúc giọng đọc tới cụm `after` trong `words.json`.
2. **Tag cảm xúc** — mốc tốt nhất, vì nó do người viết script đặt đúng chỗ có cảm xúc chứ
   không phải máy đoán: `<laugh>` → chữ V, `<sigh>` → mặt xanh, `<gasp>` → ôm má ngạc nhiên,
   `<breath>` → chống cằm, `<short pause>` → tư thế bổ trợ (nó là nhịp ngắt ý, không phải
   cảm xúc). `words.json` đã lọc hết tag nên định vị bằng cách đếm token đứng trước tag —
   đã kiểm: số token sau khi bỏ tag khớp đúng số từ đã align.
   **Đừng lấy `<laugh>` làm tư thế nền**: nền đã cười thì tới lúc cười không còn gì để đổi,
   và nhân vật cười sẵn từ trước câu đùa.
3. Từ chuyển ý trong lời thoại: `ví dụ` → bỏng ngô, `nhưng` → nghiêng đầu, `nhớ/quan trọng`
   → chỉ tay, `rắc rối/phức tạp` → mặt xanh…
4. Scene dài hơn 14 giây mà không bắt được gì: đổi một lần ở **ranh giới câu** gần giữa
   scene, sang tư thế bổ trợ trong bảng `COMPLEMENT`.

`COMPLEMENT` là **một bước tiến của cùng một mạch cảm xúc**, không phải đổi qua lại cho khác
đi: nghĩ → càng rối → vỡ lẽ (`think` → `think-doubt` → `curious`), kể → giảng → nhấn mạnh
(`neutral` → `point-explain` → `point`).

Ràng buộc: mỗi tư thế đứng ít nhất **3,0 giây**, không đổi trong **2,0 giây** đầu và cuối
scene, tối đa 3 tư thế, và mỗi lần đổi có một nhịp mờ 200ms. Scene ngắn hơn 10 giây
(hook, câu hỏi, endcard) không thể đổi — đó là đúng, không phải thiếu sót.

Scene **lẻ** dùng bản lật `-left` của cùng tư thế (bảng `MIRROR`), để hai scene liền nhau
cùng ý không ra y hệt một khung hình. Đó không phải đổi nghĩa, chỉ đổi bên.

Đo trên tập 1 sau khi viết tag: 0,96 lần đổi mỗi scene, 17 tư thế khác nhau được dùng,
14/17 khoảng chết đã được lấp.

**Đừng quay lại cách đổi theo tiến độ frame.** Bản đầu đổi 3–4 lần theo frame và chọn bằng
`sceneIndex % n` — nhân vật đổi dáng giữa câu, dáng lại chẳng liên quan gì tới điều đang nói.

**Tên tư thế KHÔNG mô tả hình vẽ.** Đã dính một lần: ánh xạ `"nhớ/quan trọng" → ok` tưởng là
gật đầu đồng ý, hoá ra `ok` vẽ cảnh **ăn bỏng ngô**. Hình thật:

| Tên | Hình vẽ |
|---|---|
| `neutral-attentive`, `touch*` | cầm sách đỏ đang đọc |
| `ok*` | ăn bỏng ngô, mắt sao |
| `shocked`, `think-doubt`, `neutral-shy` | mặt xanh, mắt xoáy, giọt mồ hôi |
| `curious*` | ôm má, mắt sao |
| `think*` | chống cằm, dấu hỏi bên đầu |
| `point*` | giơ ngón trỏ, cười tự tin |
| `peace*` | giơ chữ V | 
| `heart*` | thả tim, nháy mắt |
| `neutral` | cười, một tay giơ ngang vai |

Sửa ánh xạ thì dựng lại bảng tra: ghép ảnh trong `public/characters/<nhân vật>/` kèm nhãn
tên file rồi nhìn, đừng suy từ tên.

### Nhịp chuyển động: thở, không phải nhảy

Mọi chu kỳ tính bằng **giây** nên đổi fps không đổi nhịp. Mức hiện tại: thở 4 giây
(±1,5px, phóng đều ±0,6%), đung đưa 6 giây (±1°), riêng tư thế vẫy tay nghiêng 1,6 giây (±2,5°).

Bản đầu nhún **1,7 lần/giây** và riêng `shocked`/`think-doubt` nghiêng **6,7 lần/giây**
(chu kỳ 0,15s, tức 2,24 độ mỗi frame). Ở cỡ 280px đó là rung, người xem đọc ra là giật.
Đo lại bất cứ lúc nào: lấy 120 frame liên tiếp trong một scene, cắt riêng dải có nhân vật,
đếm pixel đổi mạnh mỗi frame — hiện ở mức 0,06% diện tích dải đó.

### Căn khung sprite

Máy sinh ảnh không giữ được khung giữa các tư thế (đo được: đỉnh đầu lệch 55–64px, chiều cao
người lệch hơn 10% khung). Chạy `npm run sprites` để đưa về đỉnh đầu 100px, người cao 82%
khung, căn theo **tâm đầu** chứ không phải tâm hộp bao — tay chỉ hay tay vẫy kéo hộp bao
lệch sang một bên. Bản gốc giữ ở `public/characters/.raw/`, script luôn căn lại từ đó nên
chạy nhiều lần không chồng méo.

### Cỡ nhân vật

Khổ dọc: lúc đứng dưới nói **12,4%** chiều cao khung, ở hook 14,8%, câu hỏi và endcard 14,1%.
Bản đầu để 9,4% — ở cỡ đó mặt chỉ còn ~70px trên điện thoại, đọc ra là sticker dán góc.

Phóng to thì phải đẩy phụ đề lên theo, nếu không nhân vật đè chữ. `captionBottom` khổ dọc
để **17%** (trước là 11%): vừa chừa chỗ cho nhân vật ở góc dưới phải — còn cách nhau 13px —
vừa tránh dải giao diện TikTok chiếm khoảng 15% đáy màn hình.

### Nhãn tên

Tắt (`theme.showSpeakerName = false`): nhân vật đã hiện hình thì nhãn tên là thừa.
Tên vẫn nằm ở hằng `CAST` đầu `SpeakerBadge.tsx` — hiện là **AN** (vai giảng) và **NỮ** (vai hỏi).

## 4. Đồng bộ timing (BẮT BUỘC sau mỗi lần đổi audio)
```
npm run sync -- --ep ep01     # sinh manifest + mốc animation + chuẩn hoá âm lượng -16 LUFS
npm run cues -- --ep ep01     # soi từng mốc: dòng nào hiện lúc giọng đang nói gì
```
**Thứ tự bắt buộc sau khi đổi lời thoại**: `voice:gemini` → `align_stt` → `sync` → `retime`
→ `sync`. `retime` đọc thời lượng từ manifest, nên chạy nó trước `sync` là nó tính trên số
cũ. (Đã sửa để nó dừng hẳn và báo thay vì sửa bừa, nhưng vẫn phải chạy đúng thứ tự.)

Đổi `narration` của scene nào thì **xoá `<scene>.words.json` của scene đó** trước khi chạy
`align_stt` — script bỏ qua scene đã có timing, mà `--force` thì lại nhận dạng lại cả tập.

`npm run poses -- --ep epNN` soi tư thế: mỗi scene đổi mấy lần, vào giây nào, và quan
trọng nhất là **"khoảng chết"** — quãng dài hơn 6 giây không bullet nào hiện ra mà cũng
không đổi tư thế. Đó chính là thứ người xem đọc ra là "video chậm". Đo tập 1 lần đầu:
21 khoảng chết trên 24 scene, có chỗ 12 giây đứng im. Scene `quote` và `outro` không có
bullet nên gần như luôn cần một mốc cảm xúc để lấp.

Lệnh này import thẳng `resolvePoseTimeline` từ `src/poses.ts` nên số nó in ra luôn đúng
bằng thứ người xem thấy. (Logic tư thế nằm ở `src/poses.ts` chứ không trong `SpeakerBadge.tsx`
vì Node đọc được `.ts` nhưng không đọc `.tsx`.)

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

## 6. Đăng TikTok
Kế hoạch đăng, caption và hashtag cho từng phần: `TIKTOK.md`.
Một video mỗi ngày, đúng thứ tự tập và phần, vì nội dung có nợ khái niệm.

## Quy ước
- Audio trong `public/voice/<ep>/`, ảnh trong `public/images/`.
- Không sửa tay `manifest.json` và `*.words.json` (script sinh ra).
- Đổi màu/font ở `src/theme.ts`, không rải style cứng trong scene. Bảng màu và lý do chọn:
  `DESIGN.md`; hợp đồng hướng thiết kế: `.impeccable/surfaces/src-episode-tsx.md`.
- Mọi cỡ chữ và lề đi qua `useLayout()` để bản dọc tự co, đừng viết px cố định.
- `vendor/` là code ngoài, không commit, không sửa — chạy Python với `-I`.
- `content/ep00.json` là tập test giọng, giữ lại để thử giọng mới.
- Chạy `npx tsc` trước khi báo xong.
