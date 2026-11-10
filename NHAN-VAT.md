# Nhân vật của kênh — hiện trạng và cách sinh thêm

## Đang dùng gì

Hai nhân vật **chibi**, do Antigravity sinh từ ảnh người thật, tỉ lệ ~2,5 đầu, tô cel phẳng,
nét rõ (tham chiếu: tạo hình trong Fate/Grand Order, không phải webtoon Hàn).

| | Vai | Thư mục | Số sprite |
|---|---|---|---|
| **AN** | `host` — giảng | `public/characters/muc/<tư thế>.png` | 28 |
| **NỮ** | `ask` — hỏi | `public/characters/son/<trang phục>/<tư thế>.png` | 8 × 28 |

PNG 1024×1024, nền trong suốt. **Gitignore** — không có trong repo, không sinh lại được bằng
code. Bản gốc trước khi căn khung giữ ở `public/characters/.raw/`.

28 tư thế: `neutral` `neutral-attentive` `neutral-shy` · `point` `point-left` `point-explain` ·
`think` `think-left` `think-doubt` · `curious` `curious-tilt` `curious-surprised` ·
`ok` `ok-right` `ok-confident` · `peace` `peace-left` `peace-playful` ·
`touch` `touch-left` `touch-cool` · `wave` `wave-left` `wave-cheer` ·
`heart` `heart-left` `heart-closeup` · `shocked`

**Tên tư thế không mô tả hình vẽ** — bảng tra hình thật nằm trong `CLAUDE.md`, mục tư thế.

## Hai vấn đề đã biết

**1. Khuôn mặt lệch giữa 8 bộ trang phục của NỮ.** Mỗi bộ sinh ở một lượt riêng nên ra 8
khuôn mặt khác nhau: `braid-rose` mặt dài mắt hạnh nhân, `bun-bow` mặt tròn mắt to,
`maroon-tee` tóc nâu chứ không đen. Trong cùng một bộ thì 28 tư thế giống hệt nhau — không
sao cả. **Cách xử lý rẻ nhất: khoá một bộ cho cả loạt**, truyền `outfit` cố định thay vì để
`pickOutfit()` xoay theo part.

**2. Nét giống người thật chỉ ở quần áo và tóc.** Mũ nồi, kính tròn, áo đồng phục cổ đỏ,
áo len đỏ — chuyển sang rất trung thực. Nhưng khuôn mặt theo khuôn mẫu chibi chung, không
phải nét riêng. Người quen nhận ra *cách ăn mặc*, không nhận ra *khuôn mặt*. Đây là đánh đổi
đã chấp nhận: mascot vốn không nên là chân dung.

## Sinh thêm tư thế mới

Ba điều bắt buộc, vì đây là chỗ đã hỏng một lần:

1. **Sinh cả bộ trong MỘT lượt.** Máy sinh ảnh giữ được sự nhất quán trong một lượt, không
   giữ được giữa các lượt.
2. **Đính kèm một sprite đã có làm mẫu phong cách**, nếu không hai nhân vật sẽ ở hai ngôn ngữ
   hình khác nhau đứng cạnh nhau trong cùng một video.
3. **Giữ nguyên khung**: 1024×1024, nền trong suốt, toàn thân, chibi ~2,5 đầu.

Khung lệch thì không sao — `npm run sprites` căn lại hết về đỉnh đầu 100px, người cao 82%
khung, căn theo **tâm đầu** chứ không phải tâm hộp bao (tay chỉ hay tay vẫy kéo hộp bao lệch
sang một bên). Script luôn đọc từ `.raw/` nên chạy nhiều lần không chồng méo.

**Mặt lệch nét thì code không cứu được**, phải sinh lại cả bộ.

### Prompt mẫu

```text
Create a set of N chibi mascot illustrations of ONE character, in a single consistent
style, for an educational video channel about software engineering.

ART STYLE
- Chibi proportions: about 2.5 heads tall. Large head, small rounded body, short limbs.
- Japanese anime game art: crisp clean linework, flat cel shading with at most two tones
  per color area, expressive eyes, strong readable silhouette.
- NOT Korean webtoon style: no soft airbrushed gradients, no beauty-portrait rendering.
- No drop shadow on the ground, no glow, no sparkles, no background.

FRAMING — identical in all images
- Square canvas 1024x1024, fully transparent background.
- Full body, centered horizontally.
- Top of the head exactly 8% down from the top edge.
- Total body height exactly 80% of the canvas height.

STYLE REFERENCE: match the attached image exactly — same chibi proportions, same line
weight, same flat cel shading, same level of detail. Only the pose differs.

OUTPUT: N separate PNG files, transparent background, the SAME character in all of them.
```

Bỏ file vào đúng thư mục ở bảng trên, chạy `npm run sprites`, rồi `npm run poses -- --ep ep01`
để xem tư thế mới có được dùng không. Muốn dùng đích danh thì đặt `"pose"` trong scene.
