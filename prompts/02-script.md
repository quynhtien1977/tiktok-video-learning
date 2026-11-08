# Prompt: dàn ý → content/epNN.json

Viết script cho tập <N> theo schema trong `src/types.ts`.

Yêu cầu lời thoại (`narration`):
- Văn nói tiếng Việt, câu dưới 25 từ, không dùng "chúng ta sẽ cùng nhau tìm hiểu" sáo rỗng.
- Không ký hiệu, không công thức, không chữ viết tắt lạ: TTS đọc sai.
  Viết "sigma bình phương", "căn bậc hai của n", "phần trăm".
- Mỗi scene mở đầu bằng một câu chốt ý, không dẫn dắt vòng vo.
- Nêu trực giác trước, hình thức hoá sau; mỗi công thức phải có một câu giải nghĩa.

Yêu cầu hình ảnh:
- Chữ trên màn hình là *tóm tắt*, không phải chép lại lời thoại (phụ đề lo việc đó).
- Tối đa 4 bullet/scene, mỗi bullet dưới 12 từ.

Sau khi viết xong: chạy `npx tsc`, rồi `npm run voice -- --ep epNN` và `npm run sync -- --ep epNN`.
