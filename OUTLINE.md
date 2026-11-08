# Dàn ý loạt video — Software Engineering (Sommerville 10e)

Nguồn: 25 file slide trong `docs/`. **Ưu tiên làm Chapter 18 trước**, các chương khác xếp sau.

## Trạng thái

- **Tập 1 đã dựng xong**: 7 phút 37 giây, 19 scene, chia 3 phần cho bản dọc TikTok.
- Giọng: Azure MAI-Voice — `vi-VN-Grant` (host, style `educational`) và `vi-VN-Harper` (câu hỏi).
- Giao diện: nền kem ấm, mực nâu đen, nhấn cam đất (xem `DESIGN.md`).
- Sơ đồ then chốt vẽ lại bằng code có animation; sơ đồ còn lại dùng ảnh trích từ slide.

## Quy ước chung cho cả loạt

- **Người xem**: sinh viên CNTT đang ôn tập / ôn thi môn Công nghệ phần mềm, đã biết lập trình,
  đã học qua OOP và HTTP cơ bản, chưa chắc nắm vững kiến trúc phân tán.
- **Ngôn ngữ**: giảng bằng tiếng Việt, **giữ nguyên thuật ngữ tiếng Anh** (service, web service,
  SOA, SOAP, WSDL, WS-BPEL, REST, resource, endpoint, binding, workflow, late binding,
  loosely coupled, utility / business / coordination service, task- và entity-oriented).
  Lần đầu xuất hiện thì nói kèm một câu giải nghĩa tiếng Việt, các lần sau dùng thẳng thuật ngữ.
- **Độ dài**: 7–10 phút/tập, chia 3 phần (mỗi phần 2–3 phút) để cắt bản dọc đăng TikTok.
  Mỗi phần mở bằng một scene tự đứng được và kết bằng một ý trọn vẹn. Mỗi tập mở đầu bằng câu hỏi trung tâm, kết bằng 3 ý chốt + nối sang tập sau.
- **Chữ trên màn hình** giữ nguyên tiếng Anh cho thuật ngữ và tên operation; phần diễn giải tiếng Việt.

---

# CHAPTER 18 — Service-oriented Software Engineering (6 tập)

Chương gồm 4 chủ đề: *Service-oriented architectures · RESTful services · Service engineering ·
Service composition* (slide 2). Mình tách thành 6 tập để mỗi tập chỉ còn một câu hỏi.

### Kiến thức nợ từ chương khác
Ch18 giả định người xem đã nắm: **software reuse** (Ch15), **component-based software engineering**
(Ch16, để so sánh service với component), **distributed software engineering** (Ch17, client–server,
middleware). → Tập 1 dành ~60 giây nhắc lại ba ý này, không cần xem trước Ch15–17.

---

## Tập 1 — Service là gì, và vì sao cần SOA
**Câu hỏi trung tâm**: Đã có object và component rồi, vì sao còn cần tới service?
*Slides 3–14, 17 · ~9 phút*

1. Định nghĩa service: "một hành vi/dịch vụ do bên này cung cấp cho bên kia", bản chất **intangible**,
   và điểm mấu chốt — việc cung cấp service **độc lập** với ứng dụng đang dùng nó.
2. Web service = **loosely coupled, reusable software component**, đóng gói một chức năng rời rạc,
   truy cập được bằng giao thức Internet chuẩn; độc lập platform và ngôn ngữ.
3. Lợi ích: ghép service từ nhiều provider trong/ngoài tổ chức · **late binding** (hoãn binding tới lúc
   deploy hoặc lúc chạy) · tạo service mới bằng cách nối service cũ · trả tiền theo lượng dùng ·
   app nhẹ hơn, đẩy phần tính toán nặng ra ngoài (quan trọng với mobile).
4. Kịch bản **in-car information system**: GPS → tìm service theo vị trí → thời tiết/giao thông/địa phương,
   qua service discovery và translation service, xe chạy qua biên giới vẫn dùng được.
5. SOA: hệ phân tán mà **component là các stand-alone service**, chạy trên máy khác nhau,
   của provider khác nhau, giao tiếp qua giao thức chuẩn.
6. Lợi ích SOA ở mức tổ chức: outsourcing được, không phụ thuộc ngôn ngữ, **giữ được đầu tư vào
   legacy system**, dễ trao đổi thông tin liên tổ chức.
7. Hai nhánh của service-oriented software engineering: **service engineering** (làm ra service để dùng lại)
   vs **development with services** (ghép service thành ứng dụng) — mở đường cho tập 4–6.

**Hình**: cả hai đã vẽ lại bằng code — `in-car-system` và `soa-triangle` trong `src/diagrams`.

---

## Tập 2 — SOAP và WSDL: mô tả một service thế nào
**Câu hỏi trung tâm**: Làm sao một máy khác hiểu được service của tôi mà không cần đọc code?
*Slides 15–23 · ~9 phút*

1. Ba chuẩn trụ cột: **SOAP** (trao đổi message), **WSDL** (định nghĩa interface + binding),
   **WS-BPEL** (ngôn ngữ workflow để compose service).
2. Stack chuẩn web service: support · composition · description · messaging · transport.
3. Service khác component trong CBSE ở chỗ nào: service **không có "requires" interface**,
   hoàn toàn độc lập, giao tiếp bằng message XML. (Đây là câu hay ra đề.)
4. WSDL trả lời ba câu: **what** (interface: operation nào, format message) · **how** (binding:
   ánh xạ interface trừu tượng xuống giao thức cụ thể) · **where** (endpoint, thường là một URI).
5. Đọc ví dụ WSDL weather service: phần `<types>` định nghĩa `PlaceAndDate`, `MaxMinTemp`,
   `InDataFault`; phần `<interface>` định nghĩa operation `getMaxMinTemps` với in / out / outfault.
6. Vì sao giới phát triển kêu bộ chuẩn này **heavyweight** — dẫn sang tập 3.

**Hình cần có**: web service standards stack (slide 16), sơ đồ cấu trúc WSDL (slide 20),
hai đoạn XML (slide 22–23) hiện dần từng khối, không đổ cả màn hình một lúc.

---

## Tập 3 — RESTful services
**Câu hỏi trung tâm**: REST khác SOAP ở đâu, và khi nào thì REST *không* phải lựa chọn tốt?
*Slides 24–33 · ~9 phút*

1. REST = **REpresentational State Transfer**, một architectural style: client nhận về
   *representation* của resource. Chính là cách web vận hành, nhẹ hơn SOAP/WSDL nhiều.
2. **Resource** là đơn vị cơ bản: một catalog, một hồ sơ bệnh án, một chương sách;
   một resource có **nhiều representation** (Word, PDF, XHTML, JSON...).
3. Bốn thao tác CRUD ↔ bốn HTTP verb: POST tạo · GET đọc · PUT cập nhật · DELETE xoá.
4. Truy cập bằng URL: `/temperatures/edinburgh`, thêm query `?date=20140226`;
   kết quả có thể là **danh sách URL** của các resource con (edinburgh-scotland / -australia / -maryland).
5. Nhược điểm của REST — phần hay bị bỏ qua: interface phức tạp (không phải resource đơn giản)
   thì khó mô hình hoá · **không có chuẩn mô tả interface** như WSDL, phải dựa vào tài liệu phi hình thức ·
   phải tự xây hạ tầng monitoring và quản lý chất lượng/độ tin cậy.
6. Bảng so sánh REST vs SOAP-based API và lời khuyên chọn cái nào.

**Hình**: `rest-verbs` đã vẽ sẵn bằng code; bảng REST vs SOAP dùng ảnh `slide33-image7.png`.

---

## Tập 4 — Service engineering (1): tìm và phân loại service
**Câu hỏi trung tâm**: Nhìn vào một doanh nghiệp, làm sao biết cái gì nên trở thành service?
*Slides 34–46 · ~10 phút*

1. Service engineering = làm ra service **để người khác dùng lại**: phải trừu tượng hoá đúng,
   phải robust, phải có tài liệu để người ta tìm thấy và hiểu được.
2. Ba giai đoạn: **service candidate identification → service design → implementation & deployment**.
3. Ba loại service: **utility** (chức năng chung, nhiều quy trình đều dùng) · **business**
   (gắn với một nghiệp vụ cụ thể, ví dụ đăng ký môn học) · **coordination** (điều phối quy trình tổng hợp).
4. Trục thứ hai: **task-oriented** (gắn với một hoạt động) vs **entity-oriented** (gắn với một thực thể
   nghiệp vụ, giống object). Coordination service thì **luôn** là task-oriented.
   → Đi qua bảng 2×3 với ví dụ: currency converter, validate claim form, process expense claim,
   document style checker, student application form.
5. Sáu câu hỏi sàng lọc một candidate: gắn với một thực thể logic dùng ở nhiều quy trình? ·
   nhiều người cùng làm tác vụ đó? hợp với mô hình RESTful không? · có độc lập không? ·
   có phải giữ state / cần database không? · client ngoài tổ chức dùng được không? ·
   các nhóm người dùng có yêu cầu phi chức năng khác nhau không?
6. **Case study catalog service** (chạy xuyên tập 4 và 5): công ty bán thiết bị máy tính, giá riêng cho
   từng khách; yêu cầu chức năng (bản catalog riêng cho từng client, tải về được, so sánh tối đa 6 mục,
   tìm kiếm, dự đoán ngày giao, virtual order giữ hàng 48 giờ) và phi chức năng (chỉ nhân viên tổ chức
   được cấp phép, giá bảo mật, phục vụ 07:00–11:00, 10 request/giây).
7. Sáu operation: MakeCatalog · Lookup · Search · Compare · CheckDelivery · MakeVirtualOrder.

**Hình cần có**: sơ đồ service engineering process (slide 36), bảng phân loại service (slide 40).

---

## Tập 5 — Service engineering (2): thiết kế interface và triển khai
**Câu hỏi trung tâm**: Từ danh sách operation tới một interface dùng được thì còn những bước nào?
*Slides 47–56 · ~10 phút*

1. Nguyên tắc thiết kế interface: **giảm tối đa số message** cho một lần gọi; nếu service stateless
   thì state phải nằm trong message.
2. Ba bước: **logical interface design** (tên operation, tham số, exception) → **message design** cho
   SOAP (mô tả bằng UML rồi sinh WSDL) → **interface design** cho REST (operation ánh xạ sang
   resource và HTTP verb nào).
3. Bảng interface của catalog service: input / output / exception của từng operation
   (mcIn–mcOut–mcFault, lookIn…, searchIn…, compIn…, cdIn…, poIn…).
4. Bản REST của cùng service đó: catalog riêng công ty là resource `<base>/<company>` tạo bằng POST ·
   mỗi item là `<base>/<company>/<item>` lấy bằng GET · Search là GET kèm query · Compare là chuỗi
   GET rồi POST tạo bảng so sánh · CheckDelivery và MakeVirtualOrder cần thêm resource **virtual order**.
   → Điểm đáng nhớ: một operation SOAP có thể phải tách thành nhiều bước REST.
5. Implementation & deployment: viết bằng ngôn ngữ thường hoặc workflow language, test bằng cách
   bơm message vào và so output, deploy = publish + cài lên web server.
6. **Legacy system services**: bọc một interface service quanh hệ thống cũ — cách rẻ nhất để có
   service mạnh, giữ lại đầu tư cũ.
7. Service description cần gì để người lạ dám dùng: thông tin doanh nghiệp (vấn đề **trust**),
   mô tả chức năng phi hình thức, hướng dẫn dùng (SOAP và REST), thông tin subscription để nhận cập nhật.

**Hình cần có**: UML input/output message (slide 51), bảng interface design (slide 49–50) tách làm 2 scene.

---

## Tập 6 — Service composition, workflow và bài toán testing
**Câu hỏi trung tâm**: Ghép service của người khác thành hệ thống của mình thì khó ở chỗ nào?
*Slides 57–69 · ~10 phút*

1. Development **with** services: ghép và cấu hình service có sẵn thành service/ứng dụng mới;
   nền tảng là **workflow** — chuỗi hoạt động logic mô tả một quy trình nghiệp vụ.
2. Ví dụ vacation package: đặt vé máy bay + thuê xe + đặt khách sạn được điều phối cùng nhau.
3. Sáu bước construction by composition: phác workflow lý tưởng → **discover** service trong registry →
   **select** (chức năng, giá, QoS: responsiveness, availability) → tinh chỉnh workflow →
   sinh chương trình workflow (Java hoặc WS-BPEL) → test.
4. WS-BPEL là XML nên dài và khó đọc; thực tế vẽ bằng **BPMN** rồi sinh WS-BPEL.
   Hệ liên tổ chức: mỗi bên một workflow riêng, nối nhau qua trao đổi message.
5. Vì sao test service composition khó: service ngoài là **black box**, không dùng được kỹ thuật dựa trên
   source code · provider sửa service làm hỏng test cũ · **dynamic binding** khiến mỗi lần chạy có thể
   gọi service khác nhau · hành vi phi chức năng phụ thuộc tải · gọi service tính phí thì test tốn tiền ·
   khó mô phỏng để kích hoạt compensating action.
6. Tổng kết chương theo 8 key point của slide 68–69 — dùng làm phần ôn thi.

**Hình cần có**: vacation package workflow (slide 59), construction by composition (slide 60),
interacting workflows (slide 65).

---

## Phần bị lược bỏ và lý do
- Các slide tiêu đề mục (11, 24, 34, 57) — không có nội dung.
- Chi tiết cú pháp XML của WSDL ngoài hai khối ở slide 22–23: đọc cả file WSDL lên video sẽ rất chán,
  chỉ giữ phần đủ để nhận ra cấu trúc what/how/where.
- Ngày tháng và số slide trong footer.

---

# Lộ trình các chương còn lại (làm sau Ch18)

Gom theo cụm, mỗi cụm 4–8 tập, thứ tự dưới đây tôn trọng "nợ khái niệm":

| Cụm | Chương | Ghi chú |
|---|---|---|
| A. Nền tảng | Ch1 Introduction · Ch2 SW Processes · Ch3 Agile | Nên làm trước nếu loạt video hướng tới người mới |
| B. Yêu cầu & thiết kế | Ch4 Requirements · Ch5 System modeling · Ch6 Architectural design · Ch7 Implementation | Ch6 là tiền đề cho Ch17–18 |
| C. Kiểm thử & tiến hoá | Ch8 Testing · Ch9 Evolution | |
| D. Dependability | Ch10 Dependable systems · Ch11 Reliability · Ch12 Safety · Ch13 Security · Ch14 Resilience | Cụm độc lập, làm lúc nào cũng được |
| E. Reuse & hệ hiện đại | Ch15 Reuse · Ch16 CBSE · **Ch17 Distributed** · **Ch18 SOA** · Ch19 Systems engineering · Ch20 Systems of systems · Ch21 Real-time | **Ch18 đang làm trước**; nếu làm tiếp cụm này thì bổ sung Ch15–17 ngay sau để khép mạch |
| F. Quản lý | Ch22 Project management · Ch23 Planning · Ch24 Quality · Ch25 Configuration management | Ít phụ thuộc, hợp làm cuối |

---

# Việc cần chốt trước khi viết script tập 1

1. **Giọng đọc**: CapCut `BV075_streaming` (Thanh Niên Tự Tin), `multi_male_felipe_uranus_bigtts`
   (Giọng Nam Trầm) hay `BV560_streaming` (Alex Đại Đế)? Nghe thử file mẫu rồi chốt.
2. **Cách đọc thuật ngữ tiếng Anh**: TTS tiếng Việt có thể đọc sai "WSDL", "SOAP", "REST", "BPEL".
   Cần nghe mẫu rồi quyết định viết trong `narration` theo kiểu nào
   (ví dụ `WSDL` → `"W S D L"`, `BPEL` → `"bi-pèo"`), chốt một lần rồi áp dụng cho cả loạt.
3. **Hình từ slide**: trích ảnh có sẵn trong file .pptx ra `public/images/` (nhanh, đúng nguyên bản)
   hay vẽ lại bằng React cho sắc nét? Đề xuất: sơ đồ đơn giản (SOA triangle, REST verbs) vẽ lại,
   sơ đồ phức tạp (workflow, in-car system) lấy ảnh từ slide.
