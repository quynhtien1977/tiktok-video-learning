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
docs/*.pptx  →  content/epNN.json  →  public/voice/epNN/*.mp3 + manifest.json  →  out/
 (đọc slide)    (script, agent viết)   (Gemini TTS + align + sync + retime)     (Remotion)
```

Chủ dự án là sinh viên, làm video để tự ôn thi và đăng TikTok. Yêu cầu nhất quán suốt dự án:
**giảng bằng tiếng Việt, giữ nguyên thuật ngữ tiếng Anh.**

## 2. Trạng thái từng phần

| Phần | Trạng thái |
|---|---|
| Script 6 tập (`content/ep01..06.json`) | **xong** — 131 scene |
| Giọng đọc 6 tập | **xong**, nhưng tập 1 vừa được viết lại tag cảm xúc và sinh lại |
| Tag cảm xúc | **tập 1 xong** (34 tag / 9 loại). **Tập 2–6 chưa làm** |
| Nhân vật chibi | **xong** — 28 tư thế cho AN, 8×28 cho NỮ, đã căn khung |
| Hệ chọn tư thế theo nội dung | **xong** (`src/poses.ts`) |
| Hiệu ứng âm thanh UI | **xong** (`public/sfx/ui/`) |
| Hook + endcard cho bản dọc | **xong** — 12 hook (part 2, 3) + 18 endcard |
| Sửa phụ đề giật | **xong** |
| 18 video dọc + 6 video ngang trong `out/` | **ĐÃ LỖI THỜI** — render trước mọi thay đổi hôm nay |
| Kế hoạch đăng TikTok (`TIKTOK.md`) | caption + hashtag xong; thời lượng cần đo lại sau khi render |

## 3. Việc phải làm tiếp, theo thứ tự

### 3.1. Viết tag cảm xúc cho tập 2–6 — việc lớn nhất còn lại

Tập 1 đã làm xong, dùng làm mẫu. Cách làm:

1. `npm run poses -- --ep ep02` — lệnh này chỉ đích danh những **"khoảng chết"**: quãng dài
   hơn 6 giây mà không bullet nào hiện ra và nhân vật cũng không đổi tư thế. Đó chính là thứ
   người xem đọc ra là "video chậm". Tập 1 lúc đầu có 21 khoảng chết trên 24 scene.
2. Đọc câu đang được nói tại mỗi khoảng chết, chèn **một tag nghe được** vào đó.
3. Chạy lại `npm run poses` cho tới khi phần lớn khoảng chết được lấp.
4. Sinh lại giọng cho những scene vừa đổi lời (xem mục 4).

Nhắm **25–35 tag một tập, trên 60% là tag nghe ra tiếng**. Tập 1 từng có 29% tag nghe được
và chủ dự án nhận xét là "nghe như không có tag".

### 3.2. Lấp 3 khoảng chết còn lại của tập 1

`s08` (10,7→17,1s), `s11` (13,1→21,4s), `s18` (14,9→21,1s). Dừng ở đây vì hết lượt free.

### 3.3. Render lại toàn bộ

24 bản (18 dọc + 6 ngang), khoảng 60 phút máy chạy:

```
npm run render:all                # cả hai khổ
npm run render:all -- --vertical  # chỉ bản dọc
```

Xong thì **cập nhật lại thời lượng trong `TIKTOK.md`** — số trong đó sẽ sai sau khi render.

### 3.4. Commit và push

Chủ dự án tự push. Agent chỉ commit, chia theo chủ đề.

## 4. Quy trình sinh giọng — sai thứ tự là hỏng

```
npm run quota                                        # xem còn bao nhiêu lượt
rm public/voice/epNN/<scene>.words.json              # BẮT BUỘC cho scene vừa đổi lời
npm run voice:gemini -- --ep epNN --only s01,s02 --force --free
python -I -X utf8 scripts/align_stt.py --ep epNN
npm run sync   -- --ep epNN
npm run retime -- --ep epNN --target 19.0 --per-scene
npm run sync   -- --ep epNN                          # chạy sync LẦN NỮA
npm run cues   -- --ep epNN                          # phải in "Tất cả mốc đều bám lời nói"
npm run poses  -- --ep epNN                          # soi tư thế và khoảng chết
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

5 key free (≈50 lượt/ngày, reset theo ngày giờ Thái Bình Dương) + 1 key trả tiền
**đã hết số dư** (còn 195đ, mỗi scene tốn ~230đ). Chủ dự án nói sẽ bỏ key trả tiền.
Dùng `--free`. ~85 scene còn lại của tập 2–6 chạy gọn trong 2 ngày.

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
| `npm run render:all` | render trọn bộ, `--vertical` / `--horizontal` / `--ep epNN` |

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
