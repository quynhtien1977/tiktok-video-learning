# RTK — cách dùng cho Antigravity

RTK (Rust Token Killer) là một lớp bọc CLI, nó chạy lệnh thật rồi **nén đầu ra** trước khi
trả về cho agent. Mục đích: cùng một lệnh nhưng tốn ít token hơn.

## Có bắt buộc không

**Không.** Mọi lệnh trong `CLAUDE.md` và `HANDOFF.md` đều viết ở dạng gốc (`npm run ...`,
`git ...`, `python -I ...`) và chạy đúng như vậy. RTK chỉ là lớp tối ưu thêm.

Nếu `rtk` chưa cài trên máy thì cứ chạy lệnh gốc, không ảnh hưởng gì tới dự án.

## Kiểm tra đã có chưa

```bash
rtk --version      # phải in: rtk X.Y.Z
rtk gain           # phải chạy được, không báo "command not found"
```

Nếu `rtk gain` báo lỗi thì máy đang cài nhầm **reachingforthejack/rtk** (Rust Type Kit) —
một công cụ khác trùng tên. Gỡ đi hoặc bỏ qua RTK.

## Dùng thế nào

Thêm `rtk` vào trước lệnh thường:

```bash
rtk git status
rtk ls scripts/
rtk cat package.json
rtk npm run lint
```

Bốn lệnh riêng của chính RTK:

| Lệnh | Việc |
|---|---|
| `rtk gain` | xem đã tiết kiệm được bao nhiêu token |
| `rtk gain --history` | lịch sử từng lệnh kèm mức tiết kiệm |
| `rtk discover` | dò xem còn lệnh nào đáng bọc mà chưa bọc |
| `rtk proxy <lệnh>` | chạy lệnh **không nén** — dùng khi cần xem đầu ra đầy đủ |

## Đáng dùng ở đâu trong dự án này

Đo thực tế (phạm vi toàn máy, 7.269 lệnh): tiết kiệm trung bình 5,5%, nhưng **không đều** —
tập trung gần hết vào vài loại lệnh:

| Loại lệnh | Mức nén |
|---|---|
| `rtk lint eslint ...` | ~99% |
| `rtk read` | ~69% |
| `rtk ls` trên thư mục lớn | ~99% |

Nên dùng cho: chạy lint, liệt kê thư mục nhiều file (`public/characters/`, `public/voice/`),
đọc file dài.

**Đừng dùng khi cần đầu ra chính xác từng ký tự**: thông báo lỗi của TypeScript, log của
ffmpeg, kết quả đo đạc. Dùng `rtk proxy` hoặc lệnh gốc cho những chỗ đó.

## Hai cái bẫy đã gặp

**1. RTK nén mất chi tiết lỗi.** Có lần `npm run lint` qua RTK chỉ in `Lint: 2 errors` mà
không nói lỗi ở đâu, phải chạy `rtk proxy npx eslint src scripts` mới thấy tên file và dòng.
Khi cần chẩn đoán thì bỏ nén.

**2. Hook viết lại lệnh có thể làm lớp duyệt an toàn từ chối.** Nếu môi trường có hook tự
thêm `rtk` vào trước lệnh, lệnh bị sửa **sau khi** đã qua kiểm duyệt, nên có thể bị chặn với
thông báo kiểu "a hook changed this call's input after auto mode reviewed it". Gặp thì chạy
lại đúng lệnh mà hook đã sinh ra, hoặc tắt hook.
