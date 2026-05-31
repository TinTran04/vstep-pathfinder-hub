# BÁO CÁO PHÂN TÍCH HỆ THỐNG & ĐẶC TẢ API VSTEPPRO

Tài liệu này là sự kết hợp toàn diện của báo cáo phân tích dự án, tài liệu hướng dẫn kết nối API (Backend-Ready) và đặc tả hợp đồng API (API Contract) của VSTEPPro.

---

## MỤC LỤC
1. [Tổng Quan & Kiến Trúc Dự Án (Project Architecture)](#1-tong-quan--kien-truc-du-an-project-architecture)
2. [Kiến Trúc Hệ Thống (System Architecture)](#2-kien-truc-he-thong-system-architecture)
3. [Phân Tích Chi Tiết Nghiệp Vụ & Luồng Nghiệp Vụ (Business Flows)](#3-phan-tich-chi-tiet-nghiep-vu--luong-nghiep-vu-business-flows)
4. [Danh Sách Toàn Bộ Use Cases (Use Cases List)](#4-danh-sach-toan-bo-use-cases-use-cases-list)
5. [Hướng Dẫn Kết Nối API Backend (Backend Integration Guide)](#5-huong-dan-ket-noi-api-backend-backend-integration-guide)
6. [Báo Cáo Kiểm Tra Hồi Quy & Sửa Lỗi Linter/TypeScript](#6-bao-cao-kiem-tra-hoi-quy--sua-loi-lintertypescript)
7. [Đặc Tả Chi Tiết Các API Endpoints (API Contract)](#7-dac-ta-chi-tiet-cac-api-endpoints-api-contract)
8. [Đề Xuất Cải Tiến Và Lộ Trình Phát Triển (Roadmap)](#8-de-xuat-cai-tien-va-lo-trinh-phat-trien-roadmap)

---

## 1. TỔNG QUAN & KIẾN TRÚC DỰ ÁN (PROJECT ARCHITECTURE)

Dự án **VSTEPPro** là một nền tảng luyện thi trực tuyến chuyên biệt cho kỳ thi VSTEP (Vietnamese Standardized Test of English Proficiency).

### 1.1. Sơ đồ Cấu trúc Thư mục (Directory Structure)

```
vstep-pathfinder-hub/
├── FE/                     # Thư mục Frontend (React SPA)
│   ├── src/
│   │   ├── assets/         # Chứa tài nguyên tĩnh như logo, ảnh minh họa
│   │   ├── components/     # Các component UI tái sử dụng toàn cục (ui/, PageTransition, etc.)
│   │   ├── features/       # Kiến trúc Feature-based chia nhỏ module
│   │   │   ├── auth/       # Module Đăng nhập / Đăng ký / Quên mật khẩu
│   │   │   ├── dashboard/  # Module Trang cá nhân học viên, Streaks & Đổi thưởng
│   │   │   ├── admin/      # Module quản trị viên (CRUD học viên, đề thi, bài mẫu)
│   │   │   ├── landing/    # Giao diện Landing Page & Đăng ý kiến đánh giá
│   │   │   ├── attempts/   # Quản lý lượt thi, Review kết quả, chuyển kỹ năng
│   │   │   └── quiz/       # Luyện thi 4 kỹ năng (L/R/W/S) & Chấm điểm AI
│   │   ├── hooks/          # Custom Hooks chung
│   │   ├── lib/            # Utilities (utils.ts)
│   │   ├── services/       # Service layer điều phối mock data / real API
│   │   ├── App.tsx         # Định nghĩa các tuyến đường (Routes)
│   │   ├── main.tsx        # Điểm khởi chạy (Entry Point)
│   │   └── index.css       # Tokens Design & Global Styles
│   └── package.json
└── BE/                     # Thư mục Backend (.NET Core 8 Web API)
    ├── VAIApplication/     # Controllers, Middlewares và ứng dụng chính
    ├── BusinessLogicLayer/ # Services, DTOs, Email Integrations
    ├── DataAccessLayer/    # Entities, DbContext, Migrations
    └── VAIApplication.slnx
```

### 1.2. Phân tích Stack Công nghệ Frontend
* **React 18 & TypeScript**: Tối ưu hóa UI rendering, đảm bảo an toàn kiểu dữ liệu (Type Safety).
* **Vite**: Hỗ trợ build & hot-reload cực nhanh.
* **Tailwind CSS & shadcn/ui**: Thiết lập Design System hiện đại, mượt mà và tối ưu responsive.
* **Framer Motion & Lenis**: Cung cấp hiệu ứng chuyển động và cuộn mượt mà (`SmoothScroll`).
* **Recharts**: Biểu đồ hóa thời gian tự học và thống kê doanh thu tại trang Admin.

---

## 2. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống hoạt động theo kiến trúc **Client-side Rendered (CSR)** kết hợp **RESTful API** Backend:

* **Authentication**: Quản lý qua token JWT (Bearer Token). State đăng nhập được đồng bộ qua LocalStorage và React Context (`useAuth`).
* **Asynchronous Service Layer**: Toàn bộ UI components giao tiếp với Service Layer bất đồng bộ (trả về Promise). Layer này sẽ tự động chuyển đổi giữa **Mock Service (localStorage)** và **Real API Service** dựa vào cài đặt biến môi trường `VITE_DATA_SOURCE`.
* **In-Memory Caching (CRUD Session)**: Đối với các thao tác Admin (thêm/sửa/xóa user, đề thi, bài mẫu) ở chế độ Mock, service duy trì một vùng nhớ local session (In-memory) và đồng bộ vào `localStorage` để cập nhật UI ngay lập tức.
* **Mock AI Feedback**: Logic chấm viết và nói được tách rời khỏi component và xử lý tập trung trong service layer trước khi tích hợp API LLM thật.

---

## 3. PHÂN TÍCH CHI TIẾT NGHIỆP VỤ & LUỒNG NGHIỆP VỤ (BUSINESS FLOWS)

### Luồng 1: Luyện thi 4 Kỹ năng (Quiz Taking Flow)
Học viên lựa chọn kỹ năng cần học thông qua trang `Quiz.tsx`. Quy trình thực hiện cụ thể:
1. **Lựa chọn Chế độ**:
   * **Luyện tập (Practice)**: Cho phép tạm dừng thời gian, tua audio (Listening). Nhấn nộp bài để xem ngay giải thích chi tiết.
   * **Thi thử (Mock Test)**: Đếm ngược thời gian nghiêm ngặt, không thể tạm dừng, khóa tua audio (Listening). Chuyển tiếp liên tục giữa các kỹ năng.
2. **Listening**: Nghe audio, trả lời trắc nghiệm 3 Parts. Giao diện tối ưu cuộn danh sách câu hỏi.
3. **Reading**: Bố cục split-screen (đoạn văn bên trái, câu hỏi bên phải), giúp học viên không cần cuộn trang lên xuống liên tục.
4. **Writing**: Viết thư (Task 1) và viết luận (Task 2) kèm đếm số từ trực tiếp. Chức năng chấm điểm AI quét lỗi chính tả, ngữ pháp, từ vựng, mạch lạc và bôi màu highlight trực quan qua component `AnnotatedText`.
5. **Speaking**: Thực hiện thu âm trực tiếp qua microphone/camera. Học viên có thể nghe lại và nhấn nộp bài để nhận đánh giá giả lập từ AI.

### Luồng 2: Dashboard & Gamification (Streaks & Rewards)
Nhằm kích thích học tập đều đặn, trang `Dashboard.tsx` vận hành cơ chế:
* **Học tập hàng ngày**: Ghi nhận hoạt động đăng nhập để cộng dồn chuỗi ngày liên tiếp (Streak). Biểu đồ hóa thời gian tự học trong tuần.
* **Tích điểm (Points)**: Thực hiện các tác vụ (Làm đề thi, duy trì streak, chia sẻ website, mời bạn bè) để nhận điểm.
* **Cửa hàng đổi quà (Rewards Store)**: Dùng điểm tích lũy đổi huy hiệu hồ sơ, lượt chấm AI Writing hoặc mã giảm giá.

### Luồng 3: Thanh toán nâng cấp Gói VIP (Premium Subscription)
Tại trang `Payment.tsx`, học viên nâng cấp tài khoản lên VIP:
1. Lựa chọn Gói Tuần hoặc Gói Tháng tại bảng giá (`PricingSection.tsx`). Hệ thống tự động chuyển hướng người dùng đến trang thanh toán `/payment`.
2. Trang thanh toán sinh mã QR VietQR động theo định dạng tiêu chuẩn ngân hàng, người dùng tiến hành quét mã chuyển khoản.
3. Nhấn "Xác nhận chuyển khoản" để hoàn thành giao dịch giả lập, tự động cập nhật gói cước tài khoản của người dùng lên VIP (lưu vào auth state và `localStorage` khóa `vstep_user`) để mở khóa tất cả các tính năng Premium.

### Luồng 4: Quản trị Hệ thống (Admin Management)
Dành cho vai trò quản trị viên tại trang `Admin.tsx`:
* **Dashboard quản trị**: Xem biểu đồ tăng trưởng người dùng, doanh thu bán gói cước, số lượt thực hiện bài thi và tỉ lệ phân bố kỹ năng đề thi.
* **CRUD Học viên**: Tìm kiếm, lọc theo vai trò (Student/Admin), trạng thái hoạt động (Active/Inactive), loại gói cước và thực hiện thêm, sửa hoặc xóa học viên.
* **CRUD Đề thi**: Thêm đề thi mới phân bước (Step-based forms) đặc thù theo từng kỹ năng.
* **CRUD Kho bài mẫu Writing (Writing Samples)**: Quản lý, thêm mới, sửa đổi hoặc xóa các bài viết mẫu thư (Task 1) và bài luận (Task 2) đạt Band 8+.
* **Quản lý Bảng giá**: Admin cập nhật giá tiền, thời hạn sử dụng và quyền lợi của các gói Premium.

### Luồng 5: Thi thử Full Test VSTEP 4 kỹ năng (Mock Test Flow)
Quy trình thi thử toàn diện:
1. **Bắt đầu Thi thử**: Học viên truy cập `/mock-test` (`MockTestLanding.tsx`), xem cấu trúc và tổng thời gian của kỳ thi thử và nhấn bắt đầu.
2. **Làm bài liên tục**: Học viên lần lượt hoàn thành 4 kỹ năng theo đúng chuẩn VSTEP (Listening → Reading → Writing → Speaking). Quyền tạm dừng thời gian và tua audio đều bị khóa.
3. **Màn hình Chuyển tiếp Tự động**: Sau khi hoàn thành một kỹ năng và bấm nộp bài (hoặc hết giờ), hệ thống sẽ hiển thị màn hình chuyển tiếp đếm ngược 5 giây (`MockTestTransition.tsx`) để thông báo kỹ năng tiếp theo trước khi tự động chuyển hướng.
4. **Xem kết quả & Review**: Sau khi làm xong kỹ năng cuối cùng (Speaking), hệ thống tính toán điểm Overall (quy đổi về thang điểm 10) và hiển thị kết quả xếp hạng band VSTEP. Học viên có thể xem lại chi tiết bài làm tại `/mock-test/review` (`AttemptReview.tsx`) để đối chiếu đáp án và xem đánh giá chi tiết của AI cho Writing và Speaking.

---

## 4. DANH SÁCH TOÀN BỘ USE CASES (USE CASES LIST)

### 4.1. Nhóm Use Cases dành cho Học viên (Student) & Khách (Guest)

| Mã UC | Tên Use Case | Tác nhân | Mô tả tóm tắt | File chính liên quan |
|---|---|---|---|---|
| **UC-01** | Đăng ký tài khoản | Khách | Tạo tài khoản học viên mới bằng tên, email, mật khẩu. | [`Auth.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/auth/pages/Auth.tsx) |
| **UC-02** | Đăng nhập hệ thống | Học viên, Admin | Xác thực người dùng bằng email và mật khẩu để cấp quyền truy cập. | [`Auth.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/auth/pages/Auth.tsx), [`useAuth.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/auth/hooks/useAuth.tsx) |
| **UC-03** | Đăng xuất | Học viên, Admin | Xóa phiên đăng nhập hiện tại và quay về màn hình trang chủ. | [`useAuth.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/auth/hooks/useAuth.tsx) |
| **UC-04** | Xem trang Landing Page | Khách, Học viên | Xem giới thiệu, lợi ích ôn thi, bảng giá cước dịch vụ và đánh giá học viên. | [`Index.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/landing/pages/Index.tsx) |
| **UC-05** | Tra cứu các gói cước Premium | Khách, Học viên | Xem thông tin chi tiết bảng giá các gói VIP tại Landing Page. | [`PricingSection.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/landing/components/PricingSection.tsx) |
| **UC-06** | Thanh toán nâng cấp VIP | Học viên | Chọn gói cước, quét VietQR ngân hàng và xác nhận giao dịch để nâng cấp tài khoản. | [`Payment.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/landing/pages/Payment.tsx) |
| **UC-07** | Xem kho bài mẫu Band 8+ | Học viên, Khách | Tham khảo các bài mẫu viết thư (Task 1) và bài luận (Task 2) ở trình độ B1/B2 kèm lý do đạt điểm. | [`WritingSamples.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/writing/pages/WritingSamples.tsx) |
| **UC-08** | Lọc đề thi theo kỹ năng | Học viên | Chọn 1 trong 4 kỹ năng (L/R/W/S) để tải danh sách các đề thi tương ứng. | [`Quiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/pages/Quiz.tsx) |
| **UC-09** | Xem cấu trúc bài thi & tips | Học viên | Xem thông tin tổng quan về thang điểm, cấu trúc các phần và mẹo làm bài thi của kỹ năng đã chọn. | [`Quiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/pages/Quiz.tsx) |
| **UC-10** | Luyện tập / Thi thử Listening | Học viên | Nghe audio trắc nghiệm 3 Parts, đếm ngược thời gian thi, nộp bài nhận kết quả. Hỗ trợ khóa tua audio và dừng timer ở chế độ Thi thử. | [`ListeningQuiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/listening/pages/ListeningQuiz.tsx) |
| **UC-11** | Luyện tập / Thi thử Reading | Học viên | Đọc 4 passages dạng split-screen, làm trắc nghiệm 40 câu hỏi, nộp bài chấm điểm tự động. Hỗ trợ khóa dừng timer ở chế độ Thi thử. | [`ReadingQuiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/reading/pages/ReadingQuiz.tsx) |
| **UC-12** | Luyện tập / Thi thử Writing | Học viên | Làm bài viết thư (Task 1) và essay (Task 2) với bộ đếm từ trực tiếp. Khóa dừng timer ở chế độ Thi thử. | [`WritingQuiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/writing/pages/WritingQuiz.tsx) |
| **UC-13** | Yêu cầu chấm điểm AI Writing | Học viên | Kích hoạt chức năng quét lỗi ngữ pháp/từ vựng/chính tả và đánh giá theo 4 tiêu chí VSTEP chuẩn. | [`WritingQuiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/writing/pages/WritingQuiz.tsx), [`AnnotatedText.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/writing/components/AnnotatedText.tsx) |
| **UC-14** | Luyện tập / Thi thử Speaking | Học viên | Luyện nói 3 Parts, bật tắt camera/mic, tiến hành ghi âm và nghe lại file đã ghi âm. Khóa dừng timer ở chế độ Thi thử. | [`SpeakingQuiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/speaking/pages/SpeakingQuiz.tsx) |
| **UC-15** | Yêu cầu đánh giá AI Speaking | Học viên | Nhận đánh giá giả lập về phát âm, độ trôi chảy, từ vựng và ngữ pháp của các file ghi âm bài nói. | [`SpeakingQuiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/speaking/pages/SpeakingQuiz.tsx) |
| **UC-16** | Xem Dashboard cá nhân | Học viên | Theo dõi biểu đồ số giờ học, phần trăm tiến độ kỹ năng, chuỗi streak hiện tại và kết quả thi gần nhất. | [`Dashboard.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/dashboard/pages/Dashboard.tsx) |
| **UC-17** | Chia sẻ và nhận điểm thưởng | Học viên | Sao chép liên kết hoặc chia sẻ lên Facebook/Zalo để được cộng điểm tích lũy vào tài khoản. | [`Dashboard.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/dashboard/pages/Dashboard.tsx) |
| **UC-18** | Đổi thưởng bằng điểm | Học viên | Dùng điểm tích lũy đổi huy hiệu hồ sơ, lượt chấm AI viết, mã giảm giá gói cước. | [`Dashboard.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/dashboard/pages/Dashboard.tsx) |
| **UC-19** | Thay đổi thông tin cá nhân | Học viên | Cập nhật tên hiển thị, địa chỉ email và tải lên ảnh đại diện mới. | [`Dashboard.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/dashboard/pages/Dashboard.tsx) |
| **UC-20** | Đổi mật khẩu tài khoản / Lấy lại mật khẩu qua OTP | Học viên | Đổi mật khẩu trong cài đặt hoặc khôi phục tài khoản qua OTP gửi về email (giới hạn thời gian nhập 1 phút). | [`Dashboard.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/dashboard/pages/Dashboard.tsx), [`Auth.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/auth/pages/Auth.tsx) |
| **UC-32** | Lựa chọn chế độ làm bài (Luyện tập hoặc Thi thử) | Học viên | Chọn Luyện tập bằng cách nhấn đề thi lẻ tại danh sách kỹ năng, hoặc chọn Thi thử bằng cách nhấn banner Mock Test. | [`Quiz.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/quiz/pages/Quiz.tsx) |
| **UC-33** | Thi thử Full Test VSTEP 4 kỹ năng | Học viên | Trải nghiệm thi thử liên tục cả 4 kỹ năng (L → R → W → S) với màn hình chờ đếm ngược 5 giây chuyển tiếp. | [`MockTestLanding.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/attempts/pages/MockTestLanding.tsx), [`MockTestTransition.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/attempts/components/MockTestTransition.tsx) |
| **UC-34** | Xem kết quả tổng hợp & Review bài thi | Học viên | Xem điểm Overall 4 kỹ năng (band B1/B2/C1) và xem lại chi tiết bài làm, nhận xét chi tiết của AI cho Writing và Speaking. | [`AttemptReview.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/attempts/pages/AttemptReview.tsx) |
| **UC-35** | Gửi đánh giá sao & Xem phân trang đánh giá | Học viên | Bình chọn và bình luận trực quan (1-5 sao) tại landing page; hiển thị phân trang tối đa 6 đánh giá/trang. | [`TestimonialSection.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/landing/components/TestimonialSection.tsx) |

### 4.2. Nhóm Use Cases dành cho Quản trị viên (Admin)

| Mã UC | Tên Use Case | Tác nhân | Mô tả tóm tắt | File chính liên quan |
|---|---|---|---|---|
| **UC-21** | Xem thống kê quản trị | Admin | Xem các báo cáo biểu đồ tài chính, phân bố đề thi, lưu lượng truy cập và hoạt động thi thử của hệ thống. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-22** | Xem danh sách & Tìm kiếm Học viên | Admin | Quản lý tài khoản, tìm kiếm theo tên/email, lọc theo role, trạng thái và gói cước. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-23** | Thêm mới tài khoản | Admin | Tạo mới trực tiếp một tài khoản học viên hoặc tài khoản quản trị từ Admin Panel. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-24** | Cập nhật thông tin học viên | Admin | Chỉnh sửa tên, email, vai trò, trạng thái tài khoản hoặc thay đổi gói cước cho học viên. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-25** | Xóa tài khoản người dùng | Admin | Xóa bỏ vĩnh viễn tài khoản người dùng khỏi hệ thống. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-26** | Xem chi tiết học viên | Admin | Mở modal xem toàn bộ thông tin chi tiết tiến độ ôn luyện của học viên. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-27** | Xem danh sách & Tìm kiếm đề thi | Admin | Quản lý danh sách đề thi của 4 kỹ năng, lọc theo mức độ khó, trạng thái active/draft. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-28** | Thêm đề thi mới phân bước | Admin | Chọn kỹ năng, sau đó điền thông tin đề thi và upload file đính kèm (audio, văn bản đọc, câu hỏi). | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-29** | Cập nhật thông tin đề thi | Admin | Sửa đổi tiêu đề, cấu trúc câu hỏi, file đính kèm hoặc thay đổi trạng thái phát hành (Draft -> Active). | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-30** | Xóa đề thi | Admin | Gỡ bỏ hoàn toàn đề thi ra khỏi hệ thống ôn luyện. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-31** | Cấu hình biểu giá & gói cước | Admin | Chỉnh sửa thông tin giá tiền, chu kỳ thanh toán và các tính năng đi kèm của các gói cước. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |
| **UC-36** | Quản lý Kho bài mẫu Writing Samples | Admin | Thêm mới, chỉnh sửa, xóa bỏ bài mẫu viết thư (Task 1) và bài luận (Task 2) Band 8+. | [`Admin.tsx`](file:///E:/EXE/be/vstep-pathfinder-hub/FE/src/features/admin/pages/Admin.tsx) |

---

## 5. HƯỚNG DẪN KẾT NỐI API BACKEND (BACKEND INTEGRATION GUIDE)

Khi Backend đã sẵn sàng, lập trình viên có thể chuyển đổi VSTEPPro từ **mock data** sang **API backend thật**.

### 5.1. Cấu hình environment
Tạo file `FE/.env` hoặc `FE/.env.production` với nội dung:
```bash
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:4000/api/v1  # Hoặc URL API Backend thật
```

### 5.2. Inject auth token (JWT)
Khi người dùng đăng nhập thành công, hãy gán token vào apiClient:
```typescript
import { apiClient } from "@/services/api-client";
apiClient.authToken = response.data.accessToken;
```
Token sẽ được tự động đính kèm vào header `Authorization: Bearer <token>` của tất cả các request tiếp theo.

### 5.3. Khai báo service dispatcher
Để chuyển đổi linh hoạt, các component chỉ import service giao diện (ví dụ `attemptsService` từ `attempts.service.ts`). File này sẽ tự động điều phối:
```typescript
import { isApiDataSource } from "@/services/data-source";
import { attemptsApiService } from "./attempts.api-service";
import { attemptsMockService } from "./attempts.mock-service";

export const attemptsService = isApiDataSource() 
  ? attemptsApiService 
  : attemptsMockService;
```

---

## 6. BÁO CÁO KIỂM TRA HỒI QUY & SỬA LỖI LINTER/TYPESCRIPT

Trong giai đoạn chuẩn bị kết nối API Backend, hệ thống đã được kiểm tra hồi quy toàn diện (Regression Audit) và tối ưu hóa mã nguồn:

### 6.1. Các lỗi logic đã được khắc phục (Hotfixes)
1. **Lỗi khôi phục chế độ làm bài (Fragile Mode Detection)**: Tránh việc mất trạng thái `mode=mock_test` khi người dùng nhấn F5 tải lại trang. Hệ thống chuyển sang đọc trạng thái `mode` trực tiếp từ lượt thi đang hoạt động (active attempt) trong `localStorage` thay vì chỉ đọc từ URL query parameter.
2. **Crash chế độ Luyện tập ở API Mode**: Khắc phục lỗi thiếu `attemptId` khi làm bài tập luyện tập đơn lẻ. Nếu không có `attemptId` trong session, hệ thống tự động gọi API để khởi tạo lượt luyện tập mới trên server trước khi nộp bài.
3. **Lưu Blob URL tạm thời ở kỹ năng Speaking**: Sửa đổi cơ chế ghi âm nói. File ghi âm được upload trực tiếp dạng binary lên Cloud Storage qua API `/speaking/upload` để lấy URL vĩnh viễn, thay vì lưu URL blob tạm thời.
4. **Cảnh báo React Hook & stale closure**: Sửa lỗi trong `MockTestTransition.tsx` bằng cách bọc hàm điều hướng trong `useCallback` và tối ưu hóa dọn dẹp interval.

### 6.2. Tiêu chuẩn hóa Linter & TypeScript Clean-up
* Đã loại bỏ tất cả các kiểu dữ liệu `any` không cần thiết, thay thế bằng các interfaces tường minh.
* Định nghĩa đầy đủ kiểu dữ liệu tuple cho Framer Motion easing trong `StaggerChildren.tsx`.
* Đạt chỉ số **0 errors** khi chạy `npx eslint src` và biên dịch đóng gói thành công 100% khi chạy `npm run build`.

---

## 7. ĐẶC TẢ CHI TIẾT CÁC API ENDPOINTS (API CONTRACT)

### 7.1. Danh sách service đã sẵn sàng API và Mock Flows

| Method | Endpoint | File triển khai | Trạng thái |
|--------|----------|-----------------|------------|
| `POST` | `/api/v1/attempts/start` | `attempts.api-service.ts` | ✅ Ready |
| `GET` | `/api/v1/attempts/:attemptId` | `attempts.api-service.ts` | ✅ Ready |
| `PATCH` | `/api/v1/attempts/:attemptId/skill` | `attempts.api-service.ts` | ✅ Ready |
| `POST` | `/api/v1/attempts/:attemptId/finish` | `attempts.api-service.ts` | ✅ Ready |
| `GET` | `/api/v1/attempts/:attemptId/result` | `attempts.api-service.ts` | ✅ Ready |
| `GET` | `/api/v1/attempts/:attemptId/review` | `attempts.api-service.ts` | ✅ Ready |
| `POST` | `/api/v1/attempts/:attemptId/speaking/upload` | `attempts.api-service.ts` | ✅ Ready |
| `POST` | `/api/v1/attempts/:attemptId/writing/submit` | `attempts.api-service.ts` | ✅ Ready |
| `POST` | `/api/v1/auth/change-password` | `auth.service.ts` | ✅ Ready (Đã nối BE) |
| `POST` | `/api/v1/auth/forgot-password` | `auth.service.ts` | ✅ Ready (Đã nối BE) |
| `POST` | `/api/v1/auth/verify-reset-otp` | `auth.service.ts` | ✅ Ready (Đã nối BE) |
| `POST` | `/api/v1/auth/reset-password` | `auth.service.ts` | ✅ Ready (Đã nối BE) |
| `GET` | `/api/v1/testimonials` | `landing.service.ts` | ⚠️ Mock (localStorage `vstep_testimonials`) |
| `POST` | `/api/v1/testimonials` | `landing.service.ts` | ⚠️ Mock (localStorage `vstep_testimonials`) |
| `GET` | `/api/v1/writing-samples` | `writing.service.ts` | ⚠️ Mock (localStorage `vstep_writing_samples`) |
| `POST` | `/api/v1/admin/writing-samples` | `admin.service.ts` | ⚠️ Mock (localStorage `vstep_writing_samples`) |
| `PUT` | `/api/v1/admin/writing-samples/:id` | `admin.service.ts` | ⚠️ Mock (localStorage `vstep_writing_samples`) |
| `DELETE` | `/api/v1/admin/writing-samples/:id` | `admin.service.ts` | ⚠️ Mock (localStorage `vstep_writing_samples`) |
| `POST` | `/api/v1/payments/verify` | `Payment.tsx` | ⚠️ Mock (localStorage `vstep_user.plan`) |

---

### 7.2. Đặc tả các Endpoint của Module Attempts

#### 1. Khởi tạo lượt làm bài mới
* **Method**: `POST`
* **URL**: `/api/v1/attempts/start`
* **Request Body**:
  ```json
  { "mode": "mock_test" }  // "practice" hoặc "mock_test"
  ```
* **Response Body (Success - 201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "mock-17123456789",
      "mode": "mock_test",
      "startedAt": 1712345678900,
      "skills": {},
      "status": "in_progress"
    }
  }
  ```

#### 2. Lấy thông tin chi tiết một lượt làm bài (Khôi phục F5)
* **Method**: `GET`
* **URL**: `/api/v1/attempts/:attemptId`
* **Response Body (Success - 200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "mock-17123456789",
      "mode": "mock_test",
      "startedAt": 1712345678900,
      "finishedAt": null,
      "skills": {
        "listening": {
          "skill": "listening",
          "answers": { "1": 2, "2": 0 },
          "score": 25,
          "totalQuestions": 35
        }
      },
      "status": "in_progress"
    }
  }
  ```

#### 3. Cập nhật câu trả lời của một kỹ năng
* **Method**: `PATCH`
* **URL**: `/api/v1/attempts/:attemptId/skill`
* **Request Body**:
  ```json
  {
    "skill": "listening",
    "answers": { "1": 2, "2": 0 },
    "score": 25,
    "totalQuestions": 35
  }
  ```

#### 4. Tải lên file ghi âm Speaking (Lên Cloud Storage)
* **Method**: `POST`
* **URL**: `/api/v1/attempts/:attemptId/speaking/upload`
* **Request Headers**: `Content-Type: multipart/form-data`
* **Request Body**:
  * `partId`: number (`1`, `2`, `3`)
  * `audio`: File (binary blob)
* **Response Body (Success - 200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "attemptId": "mock-17123456789",
      "partId": 1,
      "audioUrl": "https://storage.vsteppro.edu.vn/attempts/mock-17123456789/speaking-part-1.webm"
    }
  }
  ```

#### 5. Chấm điểm bài viết (Writing) qua AI
* **Method**: `POST`
* **URL**: `/api/v1/attempts/:attemptId/writing/submit`
* **Request Body**:
  ```json
  {
    "writings": {
      "1": "Dear Sir/Madam, I am writing this letter to...",
      "2": "In recent years, technology has developed rapidly..."
    }
  }
  ```
* **Response Body (Success - 200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "writingFeedback": {
        "1": {
          "taskAchievement": "Đáp ứng tốt yêu cầu đề bài...",
          "coherence": "Mạch lạc...",
          "lexical": "Từ vựng tốt...",
          "grammar": "Không có lỗi sai nghiêm trọng.",
          "score": "7.5",
          "tips": ["Nên dùng đảo ngữ."],
          "errors": [
            {
              "word": "writting",
              "type": "spelling",
              "suggestion": "writing",
              "explanation": "Viết sai chính tả."
            }
          ]
        }
      }
    }
  }
  ```

#### 6. Kết thúc lượt làm bài (Tổng hợp điểm và Xếp Band)
* **Method**: `POST`
* **URL**: `/api/v1/attempts/:attemptId/finish`
* **Response Body (Success - 200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "mock-17123456789",
      "mode": "mock_test",
      "finishedAt": 1712345679900,
      "overallScore": 6.5,
      "level": "B2",
      "strengths": ["Khả năng nghe hiểu tốt."],
      "weaknesses": ["Cần cải thiện đọc hiểu chi tiết."],
      "recommendedPractice": ["Luyện thêm dạng câu hỏi suy luận."]
    }
  }
  ```

---

### 7.3. Đặc tả API Sổ tay từ vựng (Vocabulary API)

#### 1. Lấy danh sách từ vựng đã lưu
* **Method**: `GET`
* **URL**: `/api/v1/vocabulary`
* **Response Body**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "vocab_1716400000_abc12",
        "word": "environment",
        "normalizedWord": "environment",
        "meaningVi": "môi trường",
        "phonetic": "/ɪnˈvaɪrənmənt/",
        "partOfSpeech": "noun",
        "example": "We need to protect the environment.",
        "audioUrl": "https://cdn.example.com/audio/environment.mp3",
        "source": "reading",
        "sourceText": null,
        "sourceUrl": "/attempts/123/review",
        "createdAt": "2026-05-23T10:00:00.000Z"
      }
    ]
  }
  ```

#### 2. Lưu một từ mới vào sổ tay
* **Method**: `POST`
* **URL**: `/api/v1/vocabulary`
* **Request Body**:
  ```json
  {
    "word": "environment",
    "source": "reading",
    "sourceText": "The environment has changed.",
    "sourceUrl": "/attempts/123/review"
  }
  ```

#### 3. Xóa một từ khỏi sổ tay
* **Method**: `DELETE`
* **URL**: `/api/v1/vocabulary/:id`
* **Response Body**:
  ```json
  { "success": true }
  ```

---

## 8. ĐỀ XUẤT CẢI TIẾN VÀ LỘ TRÌNH PHÁT TRIỂN (ROADMAP)

### 8.1. Nâng cấp Kiến trúc Kỹ thuật (Backend & Database)
* **RESTful API**: Thay thế toàn bộ mock service sang API ASP.NET Core đã được xây dựng.
* **Lưu trữ tập tin đám mây**: Cấu hình Azure Blob Storage hoặc AWS S3 để lưu file ghi âm bài nói (.webm/.mp3) của học viên.
* **Caching & Rate Limiting**: Sử dụng Redis cache đề thi và áp dụng Rate Limiting bảo vệ API chấm thi AI.

### 8.2. Tích hợp AI Chấm thi Thực tế (Real AI Integration)
* **Writing AI Evaluation**: Tích hợp API Gemini 1.5 Flash hoặc GPT-4o để phân tích ngữ pháp, từ vựng và trả về cấu trúc lỗi JSON chính xác thay cho logic Regex giả lập hiện tại.
* **Speaking AI Evaluation**: Tích hợp OpenAI Whisper để chuyển đổi giọng nói thành văn bản (Transcription) và thuật toán Phoneme matching chấm điểm phát âm tự động.

### 8.3. Tự động hóa Thanh toán & Kích hoạt Premium
* **Kênh PayOS / VietQR**: Cấu hình webhook nhận thông báo giao dịch thành công để tự động nâng cấp User Plan lên Premium mà không cần quản trị viên duyệt thủ công.
