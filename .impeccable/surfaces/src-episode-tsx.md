---
version: 1
slug: "src-episode-tsx"
primary_target: "src/Episode.tsx"
related_targets: []
---

Scope: toàn bộ khung hình video của loạt bài (Remotion compositions trong `src/`), cả bản 16:9
và bản dọc 9:16 cắt phần cho TikTok. Visitor mode: Read — người xem ở đây để hiểu một chương
giáo trình, nên cấu trúc phục vụ việc hiểu, rồi mới tới việc nhìn đã mắt.

Audience / job: sinh viên ôn thi Công nghệ phần mềm, xem trên điện thoại là chính, nhiều người
xem không bật tiếng. Việc của họ: nắm ý chính của chương và nhớ được tới lúc thi.

Hướng đã được người dùng chốt (pinned, không roll lại): bảng màu sáng ấm kiểu Claude.
Lý do kỹ thuật ủng hộ: 12 sơ đồ trích từ slide đều có nền trắng — trên nền sáng ấm chúng hoà vào
trang, còn trên nền tối phải bọc card trắng nên lúc nào cũng có viền chọi mắt.

## Direction contract

THESIS: Một trang giáo trình được giảng ra tiếng nói — không phải một slide deck quay màn hình,
cũng không phải video "dark tech" với glow và grid. Từ chối cách sắp xếp mặc định của thể loại:
bullet trôi giữa nền tối, mỗi scene vào bằng cùng một hiệu ứng fade. Ở đây mỗi loại scene có một
cách xuất hiện riêng, và sơ đồ là nhân vật chính chứ không phải ảnh minh hoạ dán vào.

OWN-WORLD: Nền kem ấm #F5F1EC (giấy sâu #EDE6DC), mực #2B2520 / #6B6054, nhấn cam đất #C8613C,
giọng hỏi mận ấm #7E4F63 trên giấy #F7EBE6, kẻ #DED5C8. Không dùng xám trung tính ở đâu cả. Chữ: Be Vietnam Pro (có dấu đầy đủ, đã self-host qua @remotion/google-fonts) —
display đậm 800 cho tiêu đề, 400/600 cho thân. Không gradient chữ, không glass, không viền màu
dày bên trái. Bề mặt duy nhất được phép nổi lên khỏi nền là sơ đồ, bằng bóng đổ có offset và blur
mềm. Thanh tiến độ mảnh 3px chạy suốt tập ở mép dưới là dấu hiệu nhận diện của khung hình.

STORY: Người xem hiểu rằng service khác component ở chỗ độc lập, rằng SOA chỉ gồm ba vai và ba
động tác, và tin rằng mình ôn được chương này mà không cần mở lại slide. Hành động: xem tiếp tập sau.

FIRST VIEWPORT: Scene mở đầu chiếm trọn khung — tiêu đề tập đặt ở một phần ba trên, cỡ lớn, căn
trái theo lề 160px (bản dọc: 80px), bên dưới là một dòng phụ ghi số tập và tổng số tập. Góc trên
trái là nhãn chương nhỏ, chữ hoa, giãn chữ rộng. Mép dưới là thanh tiến độ. Phụ đề karaoke nằm ở
đáy khung, luôn hiện.

FORM: Pinned bởi người dùng ("giao diện màu như Claude"), không chạy concept-seed. Dạng: trang
giáo trình in — lề rộng, mực trên giấy ấm, sơ đồ như hình minh hoạ trong sách. seed: none (pinned
by user).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
verdict, DESIGN.md, and every shipping raster carrying its provenance.
