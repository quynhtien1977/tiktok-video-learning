# Video giải thích lý thuyết — nhiều tập

Remotion (React → video) + TTS (Azure AI Speech, hoặc giọng CapCut), timeline tự khớp theo
độ dài giọng đọc thật.

## Cài đặt
```bash
npm install
cp .env.example .env     # điền AZURE_SPEECH_KEY + AZURE_SPEECH_REGION
```
Cần sẵn `ffmpeg`/`ffprobe` trong PATH (đã có trên máy này).

## Làm một tập
```bash
# 1. bỏ tài liệu vào docs/, nhờ Claude viết content/ep01.json (xem prompts/)
npm run voice -- --ep ep01     # 2. sinh giọng Azure + timing từng chữ
npm run sync  -- --ep ep01     # 3. đo độ dài thật -> manifest.json
npm run dev                    # 4. xem trước trong Remotion Studio
npm run render -- ep01 out/ep01.mp4 --concurrency=4
```

## Giọng CapCut (mặc định, qua API)

```bash
git clone https://github.com/quynhtien1977/capcut-tts-api.git vendor/capcut-tts-api
npm run voices:capcut                      # 24 giọng vi-VN
npm run voice:capcut -- --ep ep01          # sinh mp3 + timing từng chữ
npm run sync        -- --ep ep01
```

Không cần tài khoản CapCut. Đây là API nội bộ của CapCut (không chính thức) nên có thể đổi hoặc
chặn bất cứ lúc nào — Azure ở trên là đường lui, cùng schema, đổi `provider` là chạy.
Nếu cả hai hỏng: `npm run capcut` xuất text dán tay vào app, `npm run split` cắt file dài theo khoảng lặng.

## Cấu trúc
```
content/epNN.json      script của tập (lời thoại + nội dung hình) — sửa ở đây là chính
docs/                  tài liệu nguồn
prompts/               prompt chuẩn: tài liệu -> dàn ý -> script
scripts/               tts-azure | sync-audio | capcut-export | capcut-split
src/types.ts           schema scene
src/scenes/index.tsx   cách vẽ từng loại scene
src/theme.ts           màu, font, fps, kích thước
public/voice/<ep>/     mp3 + words.json + manifest.json (script sinh, không sửa tay)
```

Chi tiết quy trình cho agent: xem `CLAUDE.md`.

Remotion miễn phí cho cá nhân và nhóm ≤ 3 người; công ty từ 4 người cần Company License
(https://remotion.pro/license).
