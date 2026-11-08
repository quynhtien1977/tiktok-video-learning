# Kế hoạch đăng TikTok — Chapter 18

18 video dọc trong `out/tiktok/`, mỗi cái 53–128 giây. Thứ tự đăng theo đúng thứ tự tập
và phần, vì nội dung có nợ khái niệm: xem p2 trước p1 sẽ hụt.

## Quy tắc chung

**Ba giây đầu quyết định.** Scene mở của mỗi phần đã được viết để tự đứng được, nhưng
caption phải làm nốt phần còn lại: đặt câu hỏi hoặc nêu con số, đừng mở bằng "Hôm nay
chúng ta sẽ tìm hiểu".

**Caption dưới 150 ký tự** cho phần nhìn thấy trước khi bấm "xem thêm". Câu hook nằm trọn
trong khoảng đó, hashtag đẩy xuống cuối.

**5–8 hashtag**, trộn ba tầng: rộng (#hoclaptrinh), vừa (#congnghephanmem), hẹp (#SOA).
Đừng nhồi 20 cái, TikTok không thưởng cho việc đó và nhìn như spam.

**Nhịp đăng**: 1 video mỗi ngày, cùng khung giờ 20–22h (giờ sinh viên rảnh). Hết 18 video
là 18 ngày, vừa đẹp một đợt ôn thi. Đăng dồn trong một ngày thì video sau ăn hết lượt
hiển thị của video trước.

**Pinned comment** cho mỗi video: ghi "Phần N/3 của tập M — xem đủ series ở playlist" kèm
link. Người xem TikTok lạc giữa series rất dễ bỏ.

**Text overlay** thì video đã có sẵn phụ đề burned-in nên không cần thêm. Đừng bật caption
tự động của TikTok, nó sẽ chồng lên phụ đề của mình.

## Hashtag dùng chung

```
#congnghephanmem #hoclaptrinh #sinhvienit #ontap #itvietnam
```

Thêm 2–3 hashtag riêng theo nội dung từng video, liệt kê ở bảng dưới.

---

## Tập 1 — Service là gì, vì sao cần SOA

**p1 · 2:08** — `out/tiktok/ep01-p1.mp4`
> Bạn đã có object, đã có component rồi. Vậy sao ngành phần mềm còn đẻ thêm "service"?
> Câu trả lời nằm ở đúng một chữ.
`#SOA #service #kientrucphanmem`

**p2 · 1:51** — `out/tiktok/ep01-p2.mp4`
> Late binding: ứng dụng chọn nhà cung cấp ngay lúc đang chạy, không phải lúc viết code.
> Đây là lý do thật sự người ta đổi sang service.
`#latebinding #SOA #backend`

**p3 · 1:58** — `out/tiktok/ep01-p3.mp4`
> Cả kiến trúc SOA chỉ gồm 3 vai và 3 động tác: publish, find, bind. Nhớ 6 chữ này là
> nhớ được cả chương.
`#SOA #webservice #ontapcuoiky`

## Tập 2 — SOAP và WSDL

**p1 · 1:28** — `out/tiktok/ep02-p1.mp4`
> Hai hệ thống không quen nhau, viết bằng hai ngôn ngữ khác nhau, vẫn gọi được nhau.
> Nhờ đâu? Nhờ ba cái chuẩn.
`#SOAP #WSDL #API`

**p2 · 1:44** — `out/tiktok/ep02-p2.mp4`
> WSDL chỉ trả lời đúng 3 câu: what, how, where. Đề thi hỏi WSDL gồm gì là trả lời được ngay.
`#WSDL #webservice #ontapcuoiky`

**p3 · 1:41** — `out/tiktok/ep02-p3.mp4`
> WSDL hay SOAP — hai cái tên này bị lẫn nhiều nhất. Một bên là tờ khai, một bên là cái phong bì.
`#SOAP #WSDL #deythi`

## Tập 3 — RESTful services

**p1 · 1:42** — `out/tiktok/ep03-p1.mp4`
> Bạn gọi REST mỗi ngày mà không biết. Mở một trang web là một lần GET rồi đấy.
`#REST #API #hoclaptrinh`

**p2 · 1:46** — `out/tiktok/ep03-p2.mp4`
> Vì sao REST nhẹ hơn SOAP? Và vì sao mỗi lời gọi REST phải tự đủ thông tin, không được
> nhớ lần trước?
`#REST #stateless #backend`

**p3 · 0:53** — `out/tiktok/ep03-p3.mp4`
> REST không thay thế hẳn SOAP. Có 3 chỗ REST thua, và biết 3 chỗ đó là biết khi nào chọn cái nào.
`#REST #SOAP #kientrucphanmem`

## Tập 4 — Tìm và phân loại service

**p1 · 1:31** — `out/tiktok/ep04-p1.mp4`
> Nhìn vào một doanh nghiệp, cái gì đáng tách ra thành service? Có hẳn quy trình 3 bước
> để trả lời.
`#SOA #serviceengineering #thietkephanmem`

**p2 · 1:53** — `out/tiktok/ep04-p2.mp4`
> Utility, business, coordination — nhân với task và entity. Một ô trong bảng này luôn
> bỏ trống, và đề thi rất hay hỏi đúng ô đó.
`#deythi #SOA #ontapcuoiky`

**p3 · 1:59** — `out/tiktok/ep04-p3.mp4`
> Yêu cầu phi chức năng không phải phần phụ. Chính nó quyết định service của bạn
> thiết kế ra sao.
`#requirements #thietkephanmem #SOA`

## Tập 5 — Thiết kế interface và triển khai

**p1 · 1:34** — `out/tiktok/ep05-p1.mp4`
> Gọi một hàm tốn micro giây. Gọi một service tốn mili giây — chậm hơn nghìn lần.
> Đó là lý do interface của service trông thô hơn.
`#API #thietkephanmem #backend`

**p2 · 1:45** — `out/tiktok/ep05-p2.mp4`
> Cùng một chức năng, bản SOAP gọi một lần, bản REST phải tách thành bốn bước.
> Không phải service nào cũng hợp REST.
`#REST #SOAP #API`

**p3 · 1:39** — `out/tiktok/ep05-p3.mp4`
> Hệ thống cũ chạy 15 năm, viết lại thì tốn. Bọc một lớp service bên ngoài là xong —
> nhưng nó có cái giá.
`#legacy #kientrucphanmem #backend`

## Tập 6 — Ghép service và bài toán testing

**p1 · 1:16** — `out/tiktok/ep06-p1.mp4`
> Đặt được vé máy bay, thuê được xe, tới khách sạn thì hết phòng. Giờ phải huỷ hết.
> Đó là compensating action.
`#workflow #microservices #backend`

**p2 · 1:45** — `out/tiktok/ep06-p2.mp4`
> Ghép service thành hệ thống gồm 6 bước. Bước mà sinh viên hay bỏ qua là bước
> tinh chỉnh lại workflow.
`#workflow #BPMN #thietkephanmem`

**p3 · 1:55** — `out/tiktok/ep06-p3.mp4`
> Service của người khác là hộp đen, họ sửa lúc nào không báo, gọi nhiều còn tính tiền.
> Vậy test kiểu gì?
`#testing #microservices #QA`

---

## Sau khi đăng hết

Gom 6 bản 16:9 trong `out/` lên YouTube thành một playlist, rồi để link ở bio TikTok.
TikTok hợp để người ta gặp lần đầu, YouTube hợp để ngồi học nghiêm túc — đừng bắt
một nền tảng làm cả hai việc.

Nếu một video nào đó chạy tốt hơn hẳn, xem nó nói về cái gì rồi viết thêm phần phụ
cho chủ đề đó, chứ đừng đăng lại cùng nội dung.
