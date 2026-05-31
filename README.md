# VSTEPPro — Nền Tảng Luyện Thi VSTEP Trực Tuyến

> Ứng dụng web luyện thi VSTEP (Vietnamese Standardized Test of English Proficiency) toàn diện với hệ thống đề thi mô phỏng, chấm điểm AI và theo dõi tiến độ cá nhân hóa.

🌐 **Live Demo:** [http://localhost:8080](http://localhost:8080)

---

## 📑 Mục lục

- [Cấu Trúc Repository](#-cấu-trúc-repository)
- [Tài Liệu Phát Triển](#-tài-liệu-phát-triển)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục Frontend](#cấu-trúc-thư-mục-frontend)
- [Các trang & Route](#các-trang--route)
- [Hệ thống Quiz theo kỹ năng](#hệ-thống-quiz-theo-kỹ-năng)
- [Hệ thống chấm điểm AI (Writing)](#hệ-thống-chấm-điểm-ai-writing)
- [Thiết kế & Design System](#thiết-kế--design-system)
- [Cài đặt & Chạy dự án](#cài-đặt--chạy-dự-án)
- [Scripts](#scripts)

---

## 📂 Cấu Trúc Repository

Thư mục dự án được tổ chức thành hai phần chính:

* **[Frontend (FE)](file:///E:/EXE/be/vstep-pathfinder-hub/FE)**: Ứng dụng Single Page Application (SPA) viết bằng **React 18**, **TypeScript**, **Vite**, và **Tailwind CSS**.
* **[Backend (BE)](file:///E:/EXE/be/vstep-pathfinder-hub/BE)**: Hệ thống API Web được xây dựng trên nền tảng **.NET Core 8 Web API** theo mô hình 3-Layer (VAIApplication, BusinessLogicLayer, DataAccessLayer).

---

## 📖 Tài Liệu Phát Triển

* **[Báo Cáo Hệ Thống & Đặc Tả API VSTEPPro](FE_DOCUMENTATION.md)**: Tài liệu gộp tích hợp phân tích cấu trúc dự án, luồng nghiệp vụ, danh sách Use Cases, hướng dẫn kết nối API thực tế và đặc tả chi tiết các API endpoints (API Contract).
* **[Nhật Ký Thay Đổi Backend (24/05/2026)](../BE/CHANGES_2026_05_24.md)**: Danh sách các tính năng, DTO, Endpoint và các logic thay đổi mới nhất liên quan đến đổi mật khẩu, quên mật khẩu (OTP) và tối ưu hóa gửi mail SMTP bằng background task.

---

## Tính năng chính

### 🎯 Luyện thi 4 kỹ năng VSTEP
- **Listening:** Giao diện khung video, danh sách câu hỏi cuộn, thanh điều khiển âm thanh cố định (±10s), trắc nghiệm A/B/C/D theo 3 Part.
- **Reading:** Bố cục split-screen (đoạn văn bên trái, câu hỏi bên phải), 4 passage với tổng 40 câu hỏi.
- **Writing:** Split-screen với 2 Task (Letter/Email + Essay), đếm từ real-time, chấm điểm AI với bôi màu lỗi trực tiếp.
- **Speaking:** Split-screen tích hợp camera/micro, ghi âm, nghe lại, AI đánh giá phát âm & ngữ điệu qua 3 Part.

### 🤖 Chấm điểm AI cho Writing
- Quét bài viết và **bôi màu lỗi** trực tiếp trên văn bản:
  - 🟡 **Vàng** – Lỗi ngữ pháp (Grammar)
  - 🟠 **Cam** – Lỗi từ vựng (Vocabulary)
  - 🔴 **Đỏ** – Lỗi chính tả (Spelling)
  - 🔵 **Xanh dương** – Lỗi mạch lạc (Coherence)
- Hover vào lỗi → hiển thị tooltip với gợi ý sửa & giải thích
- Chấm theo 4 tiêu chí VSTEP: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammar Range & Accuracy
- Đưa ra tips cải thiện cụ thể cho từng task

### 📊 Dashboard cá nhân hóa
- Tổng quan tiến độ học tập với biểu đồ
- Điểm gần nhất theo từng kỹ năng (Listening, Reading, Writing, Speaking)
- Danh sách bài học & đề thi đã hoàn thành
- Mục tiêu cá nhân & streak học tập

### 📝 Bài mẫu Writing (Band 8+)
- Bài mẫu Task 1 (Letter/Email) & Task 2 (Essay)
- Phân loại theo level B1/B2
- Phân tích lý do đạt điểm cao

### 💳 Thanh toán & Nâng cấp VIP (/payment)
- Chọn gói cước VIP (Gói Tuần / Gói Tháng)
- Sinh mã QR VietQR động theo chuẩn ngân hàng để học viên chuyển khoản tiện lợi
- Giả lập xác nhận thanh toán để mở khóa toàn bộ tính năng Premium

### 🔐 Xác thực người dùng
- Đăng nhập / Đăng ký với email & mật khẩu
- Khôi phục tài khoản qua mã OTP gửi về email (giao diện đếm ngược 1 phút để nhập OTP trước khi hết hạn)
- Validation form đầy đủ (email format, password length, confirm password)

### 🛠️ Trang Admin
- Dashboard tổng quan: tổng user, đề thi, doanh thu, tỷ lệ hoàn thành
- Quản lý người dùng (CRUD, search, filter)
- Quản lý đề thi (thêm/sửa/xoá theo từng skill)
- Quản lý bài mẫu Writing Samples (CRUD)

---

## Công nghệ sử dụng

| Công nghệ | Mô tả |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Component library (Radix UI + Tailwind) |
| **React Router v6** | Client-side routing |
| **TanStack React Query** | Server state management |
| **Lucide React** | Icon library |
| **Recharts** | Biểu đồ & data visualization |
| **React Hook Form + Zod** | Form management & validation |
| **Vitest** | Unit testing |
| **Framer Motion** | Animation & Page transitions |
| **Lenis** | Smooth scrolling |
| **Be Vietnam Pro** | Font chữ chính (Google Fonts) |

---

## Cấu trúc thư mục Frontend

```
FE/
├── src/
│   ├── assets/             # Tài nguyên hình ảnh tĩnh
│   ├── components/         # Component UI tái sử dụng toàn cục
│   │   ├── ui/             # Thư viện component của shadcn/ui
│   │   ├── PageTransition.tsx  # Hiệu ứng chuyển trang mượt mà
│   │   ├── SmoothScroll.tsx    # Cuộn mượt mà sử dụng Lenis
│   │   └── StaggerChildren.tsx # Hiệu ứng xuất hiện tuần tự
│   ├── features/           # Kiến trúc chia nhỏ theo Module/Feature
│   │   ├── auth/           # Xác thực, đăng ký, quên mật khẩu (OTP)
│   │   ├── dashboard/      # Dashboard tiến độ cá nhân & Đổi thưởng
│   │   ├── admin/          # Quản lý danh sách học viên, đề thi, bài mẫu
│   │   ├── landing/        # Landing Page, bảng giá, VietQR payment
│   │   ├── quiz/           # Trắc nghiệm, chấm Writing & Speaking AI
│   │   └── attempts/       # Lượt thi, Review chi tiết & Transition [NEW]
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Config & Utilities chung
│   ├── pages/              # Các trang tiện ích (NotFound, ...)
│   ├── services/           # Service nền tảng & apiClient Backend-Ready
│   ├── App.tsx             # Định nghĩa cấu trúc Routes chính
│   ├── main.tsx            # Điểm khởi chạy của dự án
│   └── index.css           # Global CSS & Design system Tokens
```

---

## Các trang & Route

| Route | Trang | Mô tả |
|---|---|---|
| `/` | Index | Landing page chính |
| `/auth` | Auth | Đăng nhập, đăng ký & quên mật khẩu |
| `/dashboard` | Dashboard | Dashboard cá nhân hóa, streak & đổi quà |
| `/quiz` | Quiz | Lựa chọn kỹ năng (L/R/W/S) & chế độ làm bài |
| `/mock-test` | MockTestLanding | Landing page thi thử toàn diện VSTEP |
| `/quiz/listening/take` | ListeningQuiz | Giao diện thi Listening (khóa tua/pause trong Thi thử) |
| `/quiz/reading/take` | ReadingQuiz | Giao diện thi Reading song song |
| `/quiz/writing/take` | WritingQuiz | Giao diện thi Writing kèm bộ đếm từ & chấm điểm AI |
| `/quiz/speaking/take` | SpeakingQuiz | Giao diện thi Speaking ghi âm & AI feedback |
| `/attempts/:attemptId/result` | AttemptResult | Bảng điểm kết quả bài làm tổng quan, xếp band VSTEP |
| `/attempts/:attemptId/review` | AttemptReview | Xem lại đáp án đúng, giải thích & transcript bài làm |
| `/payment` | Payment | Trang thanh toán nâng cấp tài khoản Premium |
| `/admin` | Admin | Quản trị học viên, đề thi, bài mẫu |
| `/writing-samples` | WritingSamples | Kho bài viết mẫu band 8+ tham khảo |
| `*` | NotFound | Trang báo lỗi 404 |

---

## Hệ thống Quiz theo kỹ năng

### Listening (3 Parts – 35 câu)
- **Part 1:** Short Announcements (8 câu) – Nghe thông báo ngắn
- **Part 2:** Conversations (12 câu) – Nghe hội thoại
- **Part 3:** Lectures (15 câu) – Nghe bài giảng dài
- Tính giờ countdown, thanh điều khiển play/pause, skip ±10s
- Chấm tự động, hiển thị kết quả đúng/sai

### Reading (4 Passages – 40 câu)
- Split-screen: passage bên trái, câu hỏi bên phải
- Các dạng câu hỏi: main idea, vocabulary in context, inference, detail
- Chấm tự động với giải thích đáp án

### Writing (2 Tasks)
- **Task 1:** Letter/Email (min 120 từ, 20 phút)
- **Task 2:** Essay (min 250 từ, 40 phút)
- Đếm từ real-time, cảnh báo khi chưa đủ từ
- Chấm điểm AI: bôi màu lỗi + gợi ý sửa + điểm 4 tiêu chí

### Speaking (3 Parts)
- **Part 1:** Social Interaction (3 phút)
- **Part 2:** Solution Discussion (4 phút)
- **Part 3:** Topic Development (5 phút)
- Tích hợp camera + micro, ghi âm, nghe lại
- AI đánh giá: Pronunciation, Fluency, Grammar, Vocabulary, Task Fulfillment

---

## Hệ thống chấm điểm AI (Writing)

### Component: `AnnotatedText`
Hiển thị bài viết của người dùng với lỗi được **bôi màu** trực tiếp:
```tsx
<AnnotatedText text={userEssay} errors={detectedErrors} />
```

### Cấu trúc lỗi (`TextError`)
```typescript
interface TextError {
  start: number;      // Vị trí bắt đầu trong text
  end: number;        // Vị trí kết thúc
  type: "grammar" | "vocabulary" | "spelling" | "coherence";
  original: string;   // Text gốc bị lỗi
  suggestion: string; // Gợi ý sửa
  explanation: string; // Giải thích lỗi
}
```

---

## Thiết kế & Design System

### Color Tokens (HSL)
```css
--primary: 217 91% 50%;       /* Blue chính */
--accent: 174 62% 47%;        /* Teal accent */
--background: 210 33% 98%;    /* Nền sáng */
--foreground: 215 25% 15%;    /* Text chính */
--muted: 210 33% 95%;         /* Nền phụ */
--destructive: 0 84% 60%;     /* Đỏ cảnh báo */
```

---

## Cài đặt & Chạy dự án

### Yêu cầu
- Node.js >= 18
- npm hoặc bun

### Khởi chạy Frontend
```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```
Mở trình duyệt tại `http://localhost:8080`

### ⚙️ Cấu hình Môi trường (Environment Variables)
Ứng dụng hỗ trợ chuyển đổi giữa dữ liệu **Mock** (chạy Local) và dữ liệu **API thật** bằng cách cấu hình tệp `.env`:
```bash
# Nguồn dữ liệu sử dụng: "mock" hoặc "api"
VITE_DATA_SOURCE=mock

# Base URL của Backend API (khi cấu hình VITE_DATA_SOURCE=api)
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

*Để xem phân tích kỹ thuật chi tiết và hợp đồng API, tham khảo thêm tại [Báo Cáo Hệ Thống & Đặc Tả API VSTEPPro](FE_DOCUMENTATION.md).*
