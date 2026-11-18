# Bàn giao dự án

Đọc file này trước, rồi đọc `CLAUDE.md` để biết cách vận hành từng bước.
File này trả lời: **dự án đang ở đâu, cái gì đã xong, cái gì đang dở, và cái gì đừng đụng vào.**

Viết ngày 2026-11-10.

---

## 1. Dự án này là gì

Một loạt video giảng lý thuyết **Software Engineering** (giáo trình Sommerville 10e) cho
người Việt, chạy trên hai khổ: 16:9 cho YouTube và 9:16 cắt làm 3 phần cho TikTok.

Đang làm **Chapter 18 — Service-oriented software engineering**: 6 tập, tổng ~30 phút,
cắt thành 18 video dọc.

Dây chuyền:

```
docs/*.pptx  →  content/cCCeEE.json  →  public/voice/cCCeEE/*.mp3 + manifest.json  →  out/
 (đọc slide)    (script, agent viết)   (Gemini TTS + align + sync + retime)     (Remotion)
```

Chủ dự án là sinh viên, làm video để tự ôn thi và đăng TikTok. Yêu cầu nhất quán suốt dự án:
**giảng bằng tiếng Việt, giữ nguyên thuật ngữ tiếng Anh.**

## 2. Trạng thái — Chapter 18 đã xong trọn vẹn

| Phần | Trạng thái |
|---|---|
| Script 6 tập | **xong** — 131 scene |
| Giọng đọc + tag cảm xúc | **xong cả 6 tập** — 29–36 tag mỗi tập, 7–9 loại, 69–94% là tag nghe ra tiếng |
| Nhịp đọc | trung vị **đúng 19,0** ký tự/giây ở cả 6 tập (dao động 17,7–20,6) |
| Tư thế nhân vật | **xong** — 0,80–1,33 lần đổi mỗi scene, 12–17 tư thế mỗi tập |
| Khoảng chết >6s | 94/97 đã lấp; 3 chỗ còn lại ở c18e01, c18e03, c18e05 (mỗi tập một chỗ) |
| Mốc animation (`npm run cues`) | cả 6 tập "Tất cả mốc đều bám lời nói" |
| **24 video trong `out/`** | **xong, render ngày 2026-11-18**, khớp với giọng hiện tại |
| `TIKTOK.md` | thời lượng đo từ chính file mp4 đã render |

Tổng: 18 video dọc **33,3 phút**, 6 video ngang **30,7 phút**.

## 3. Việc còn lại

### 3.1. Đăng bài

Theo `TIKTOK.md`: một video mỗi ngày, đúng thứ tự tập và phần.

### 3.2. Chương tiếp theo

Xem `OUTLINE.md` để biết chương nào làm tiếp. Quy trình y như Chapter 18:
đọc slide → viết `content/cCCeEE.json` (kèm tag cảm xúc ngay từ đầu, đừng để thêm sau) →
sinh giọng → align → sync → retime → sync → `cues` → `poses` → render.

Bài học từ Chapter 18: **viết tag ngay lúc viết script**. Thêm tag sau nghĩa là sinh lại
giọng gần như toàn bộ — Chapter 18 tốn ~130 lượt TTS chỉ cho việc đó.

### 3.3. Ba khoảng chết nhỏ còn sót (tuỳ chọn)

`npm run poses -- --ep c18e01` (và c18e03, c18e05) chỉ đích danh từng chỗ. Không cản việc đăng.

### 3.4. Commit và push

Chủ dự án tự push. Agent chỉ commit, chia theo chủ đề.

### 3.5. Render

```bash
npm run render:resume             # CHỈ render bản đã cũ hơn đầu vào — dùng cái này
npm run render:all                # render lại tất cả từ đầu
npm run render:all -- --ep c18e03   # một tập
```

Một lượt đủ 24 bản mất ~60 phút. Từng có lần tắt máy giữa chừng phải chạy lại cả tiếng cho
3 bản đã xong — `render:resume` sinh ra từ đó. Log ghi ở `out/render.log`.

## 4. Quy trình sinh giọng — sai thứ tự là hỏng

```
npm run quota                                        # xem còn bao nhiêu lượt
rm public/voice/cCCeEE/<scene>.words.json              # BẮT BUỘC cho scene vừa đổi lời
npm run voice:gemini -- --ep cCCeEE --only s01,s02 --force --free
python -I -X utf8 scripts/align_stt.py --ep cCCeEE
npm run sync   -- --ep cCCeEE
npm run retime -- --ep cCCeEE --target 19.0 --per-scene
npm run sync   -- --ep cCCeEE                          # chạy sync LẦN NỮA
npm run cues   -- --ep cCCeEE                          # phải in "Tất cả mốc đều bám lời nói"
npm run poses  -- --ep cCCeEE                          # soi tư thế và khoảng chết
```

Ba cái bẫy đã dính, đừng dính lại:

- **`retime` phải chạy SAU `sync` lần đầu.** Nó đọc thời lượng từ manifest; chạy trước thì nó
  tính trên số cũ, ra hệ số ngoài khoảng ffmpeg nhận rồi chết giữa chừng.
- **Xoá `words.json` của đúng scene vừa đổi lời**, đừng dùng `--force` cho cả tập — `--force`
  bắt nhận dạng lại toàn bộ, tốn thời gian vô ích.
- **Đặt tag sau dấu câu**: `chông chênh. <tsk>` chứ không phải `chông chênh <tsk>.` Tag bị lọc
  đi sẽ để dấu chấm đứng một mình thành token thừa, lệch số từ so với `words.json`, làm toàn
  bộ mốc tư thế trượt. Kiểm nhanh: số token của `narration` sau khi bỏ tag phải bằng đúng số
  phần tử trong `words.json`.

### Key và chi phí

5 key free (≈50 lượt/ngày, reset theo ngày giờ Thái Bình Dương — tức khoảng 15h giờ
Việt Nam) + 1 key trả tiền **đã hết số dư**. Dùng `--free`.

Lỗi mạng tạm thời (`fetch failed`, timeout, 429, 5xx) giờ được **thử lại 3 lần** tự động.
Trước đây một lần `fetch failed` làm dừng cả lượt, lại in nhầm thành "hết quota", để lại
một tập dở dang — 6 scene vừa mất giọng mới vừa mất timing. Nếu vẫn dừng thì đọc kỹ
thông báo: nó phân biệt hết tiền / lỗi mạng / hết lượt, ba cái chữa ba kiểu.

## 5. Những điều đã đo được — đừng làm lại từ đầu

Đây là phần giá trị nhất của bàn giao. Mỗi dòng dưới đây là một vòng thử sai đã tốn thời gian.

**Âm thanh**

- Loa điện thoại gần như không phát gì **dưới 300Hz**. Bộ hiệu ứng đầu tiên đặt tiếng `thunk`
  ở 52Hz (99,9% năng lượng dưới 120Hz) — đo đỉnh -4,4dB rất to mà người xem không nghe thấy
  gì. **Muốn tiếng rõ hơn thì đổi tần số, đừng tăng âm lượng.**
- Tag cảm xúc chạy ở **cả hai tầng** model Gemini. Đã nghe kiểm chứng.
- **Đừng kết luận chuyện tag bằng máy.** Đo khoảng lặng và đo đuôi file đều không thấy tiếng
  cười mà tai người nghe ra rõ. Muốn biết tag có ăn không thì nhờ người nghe.
- `<whispers>` không nghe được. `<breath>` và `<short pause>` gần như không nhận ra.

**Phụ đề**

- Đổi `fontWeight` giữa chừng làm **cả dòng xô ngang**, vì nét đậm rộng hơn nét thường và
  phụ đề căn giữa. Đo được: bề rộng đổi 66px trong 33 frame, mép phải nhảy 32px trong một
  frame. Giữ nét cố định, chỉ đổi màu.
- Khoảng lặng giữa hai mệnh đề từng làm phụ đề **nháy sang mệnh đề cuối của cả scene** trong
  ~3 frame rồi nhảy ngược lại. Giờ giữ mệnh đề đang hiện cho tới khi mệnh đề sau bắt đầu.

**Nhân vật**

- Máy sinh ảnh giữ được sự nhất quán **trong một lượt**, không giữ được **giữa các lượt**.
  Mỗi trang phục của NỮ sinh ở một lượt riêng nên ra 8 khuôn mặt khác nhau. Cần bộ nào nhất
  quán thì sinh trọn bộ trong một lượt.
- Khung sprite máy sinh ra lệch nhau nhiều (đỉnh đầu lệch 55–64px, chiều cao lệch hơn 10%
  khung) → nhân vật nhảy và đổi cỡ mỗi lần đổi tư thế. `npm run sprites` căn lại.
- **Tên tư thế không mô tả hình vẽ.** `ok` vẽ cảnh ăn bỏng ngô, `neutral-attentive` và
  `touch` đều là cầm sách đọc, `shocked`/`think-doubt`/`neutral-shy` đều là mặt xanh mắt xoáy.
  Sửa ánh xạ thì ghép ảnh ra xem, đừng suy từ tên. Bảng tra đầy đủ trong `CLAUDE.md`.
- Nhịp chuyển động của nhân vật phải là **thở, không phải nhảy**. Bản đầu nhún 1,7 lần/giây
  và riêng vài tư thế rung 6,7 lần/giây — chủ dự án mô tả là "giật kinh phong".
- Nhân vật ở 9,4% chiều cao khung thì mặt chỉ còn ~70px trên điện thoại, đọc ra là sticker
  dán góc. Hiện để 12,4%.

**Tư thế**

- **Đừng đổi tư thế theo tiến độ frame.** Bản đầu đổi 3–4 lần mỗi scene theo frame và chọn
  bằng `sceneIndex % n` — nhân vật đổi dáng giữa câu, dáng lại chẳng liên quan gì tới điều
  đang nói. Mốc đổi phải neo vào lời nói.
- Tầng dự phòng "đổi ở ranh giới câu gần giữa scene" từng chiếm 71% số lần đổi, và vì nó
  không nhìn nội dung nên chủ dự án nhận ra ngay là lệch. Giờ nó bắt buộc phải đọc câu kế
  tiếp và chỉ đổi khi câu đó mang màu khác.

**TikTok**

- Part 1 **không cần hook** — nó đã mở bằng scene `title` của tập rồi, thêm hook nữa là hai
  cái mở đầu chồng lên nhau. Chỉ part 2 trở đi mới cần, vì chúng bị cắt ra từ giữa video.
- Scene `hook` cần **hai nhịp**: câu hỏi tạo khoảng trống, rồi lời hứa "xem xong làm được gì".
- Giao diện TikTok chiếm khoảng 15% đáy màn hình, nên phụ đề khổ dọc để ở 17% chứ không phải 11%.

## 6. Công cụ tự viết — đọc phần đầu mỗi file để biết nó làm gì

| Lệnh | Việc |
|---|---|
| `npm run quota` | còn bao nhiêu lượt Gemini hôm nay |
| `npm run voice:gemini` | sinh giọng; `--only a,b,c` `--force` `--free` `--paid` |
| `npm run sync` | sinh manifest + mốc animation + chuẩn âm lượng |
| `npm run retime` | cân nhịp đọc về 19,0 ký tự/giây |
| `npm run cues` | soi mốc animation có bám lời nói không |
| `npm run poses` | soi tư thế nhân vật và **khoảng chết** |
| `npm run sprites` | căn khung lại cho sprite nhân vật |
| `npm run sfx:ui` | sinh lại bộ hiệu ứng âm thanh |
| `npm run render:all` | render trọn bộ, `--vertical` / `--horizontal` / `--ep cCCeEE` |
| `npm run render:resume` | chỉ render bản đã cũ hơn đầu vào — chạy tiếp sau khi bị ngắt |

`npm run poses` import thẳng hàm thật từ `src/poses.ts`, nên số nó in ra luôn đúng bằng thứ
người xem thấy. Giữ nguyên tính chất đó: **đừng chép lại logic tư thế sang chỗ khác.**

## 7. Đừng đụng vào

- **`public/characters/`** và **`char_reference/`** — sprite nhân vật và ảnh gốc của em gái
  chủ dự án. Gitignore, không có trong repo, không sinh lại được bằng code. Mất là mất.
  `public/characters/.raw/` là bản gốc trước khi căn khung, `npm run sprites` luôn đọc từ đó.
- **`capcut/`** — 307MB video tham chiếu tải về. Gitignore. Hỏi chủ dự án trước khi xoá.
- **`.env`** — khoá API.
- **`manifest.json`** và **`*.words.json`** — script sinh ra, sửa tay là hỏng đồng bộ.
- **`vendor/`** — code ngoài, chạy Python với `-I`.
- **`docs/*.pptx`** — slide có bản quyền, không commit.

## 8. Cách làm việc mà chủ dự án mong đợi

Rút ra từ cả quá trình, nói thẳng để đỡ mất thời gian:

- **Đo trước khi sửa, và đưa ra con số.** Gần như mọi vòng lặp trong dự án này được giải
  quyết bằng một phép đo, không phải bằng phỏng đoán.
- **Làm một tập mẫu rồi mới nhân ra sáu tập.** Chủ dự án duyệt theo kiểu nhìn/nghe thật,
  sửa một tập rẻ hơn sửa sáu tập.
- **Nói thẳng khi phép đo không kết luận được.** Có lần máy không phát hiện ra tiếng cười mà
  tai người nghe rõ — nói "không kết luận được, nhờ bạn nghe" thì đúng hơn là đoán bừa.
- Viết tài liệu bằng **tiếng Việt**, giữ thuật ngữ kỹ thuật bằng tiếng Anh.
- Chạy `npx tsc` và `npm run lint` trước khi báo xong.
