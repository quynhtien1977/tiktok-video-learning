# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Sinh viên CNTT đang ôn tập môn Công nghệ phần mềm theo giáo trình Sommerville 10e. Họ đã biết
lập trình và OOP, chưa chắc nắm vững kiến trúc phân tán. Tình huống xem: ôn trước kỳ thi hoặc
trước buổi thuyết trình, thường trên điện thoại, đôi khi trên máy chiếu phòng học. Người làm
video là một sinh viên trong số đó, dựng bằng Claude Code từ chính bộ slide của môn.

## Product Purpose

Biến 25 file slide `.pptx` thành loạt video giảng tiếng Việt, mỗi chương vài tập. Thành công là
người xem hiểu được ý chính của chương mà không phải đọc lại slide, và người làm sửa được một
câu thoại rồi render lại mà không phải dựng tay.

## Positioning

Script nằm trong JSON và timeline sinh ra từ độ dài audio thật, nên mọi chỉnh sửa đều là sửa chữ
rồi chạy lại ba lệnh — khác hẳn dựng tay trong CapCut, nơi sửa một câu là kéo lại toàn bộ timeline.
Sơ đồ lấy thẳng từ slide gốc (EMF vector) nên nội dung không sai lệch so với giáo trình.

## Operating Context

- Nguồn: `docs/*.pptx` (25 chương). Chapter 18 làm trước, các chương khác xếp theo `OUTLINE.md`.
- Pipeline: viết `content/epNN.json` → sinh giọng → căn timing → `sync` → render Remotion.
- Giọng: Azure MAI-Voice (`vi-VN-Grant` host, `vi-VN-Harper` hỏi); CapCut TTS là đường lui.
- Phụ đề: chữ lấy từ script, thời gian lấy từ STT CapCut, căn bằng Needleman-Wunsch.
- Phát hành: xem/ôn riêng và chia sẻ nhóm lớp; có thể cắt tập thành nhiều phần ngắn đăng TikTok.

## Capabilities and Constraints

- Hai tỉ lệ khung hình: 16:9 cho bản đầy đủ, 9:16 cho bản TikTok. Một tập cắt được thành nhiều
  phần (`part`), mỗi phần render riêng.
- TTS tiếng Việt đọc thuật ngữ tiếng Anh không chuẩn nếu viết tách chữ; phải viết liền.
- Azure MAI-Voice không trả word boundary → bắt buộc chạy bước căn phụ đề bằng STT.
- CapCut TTS bỏ qua toàn bộ SSML; chỉ `emotion` có tác dụng. Tốc độ đọc chỉnh bằng `ffmpeg atempo`.
- Mỗi scene là một file audio; thời lượng scene = thời lượng audio, không hardcode.

## Brand Commitments

- Giảng bằng tiếng Việt, **giữ nguyên thuật ngữ tiếng Anh** (service, SOA, WSDL, REST, workflow…).
- Hai giọng: nam giảng chính, nữ đặt câu hỏi chen giữa để chia nhịp.
- Bảng màu do người dùng chọn: nền sáng ấm kiểu Claude, chữ mực nâu đen, nhấn cam đất.

## Evidence on Hand

- `docs/` — 25 file slide gốc của môn học.
- `public/images/ch18/` — 12 sơ đồ Chapter 18 đã trích từ EMF, 3x, nền trắng.
- `out/ep01-service-va-soa.mp4` — tập 1 bản đầu, 5 phút 29 giây, đã render thật.
- `OUTLINE.md` — dàn ý 6 tập Chapter 18 và lộ trình 24 chương còn lại.
- Chưa có: logo, nhạc nền, ảnh thumbnail. Không được bịa số liệu hay nguồn ngoài giáo trình.

## Product Principles

1. Giáo trình là nguồn sự thật. Diễn đạt lại cho dễ hiểu, không thêm kết luận không có trong slide.
2. Lời thoại là nguồn duy nhất: giọng đọc, phụ đề và nhịp hình đều sinh ra từ nó.
3. Chữ trên màn hình tóm tắt, không chép lại lời thoại.
4. Mỗi scene một ý. Hiểu nhầm thường đến từ việc nhồi hai ý vào một khung hình.
5. Sửa nội dung phải rẻ: mọi thứ phái sinh đều tái tạo được bằng lệnh.

## Accessibility & Inclusion

Phụ đề luôn bật sẵn trong khung hình (burned-in) vì người xem hay xem không bật tiếng.
Chữ thân bài tối thiểu tương đương 32px ở 1080p để đọc được trên điện thoại.
