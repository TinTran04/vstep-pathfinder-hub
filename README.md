# VSTEPPro – Nền tảng Luyện thi VSTEP Trực tuyến

> Ứng dụng web luyện thi VSTEP (Vietnamese Standardized Test of English Proficiency) toàn diện với hệ thống đề thi mô phỏng, chấm điểm AI và theo dõi tiến độ cá nhân hóa.

🌐 **Live Demo:** [https://vstep-pathfinder-hub.lovable.app](https://vstep-pathfinder-hub.lovable.app)

---

## 📑 Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Các trang & Route](#các-trang--route)
- [Hệ thống Quiz theo kỹ năng](#hệ-thống-quiz-theo-kỹ-năng)
- [Hệ thống chấm điểm AI (Writing)](#hệ-thống-chấm-điểm-ai-writing)
- [Thiết kế & Design System](#thiết-kế--design-system)
- [Cài đặt & Chạy dự án](#cài-đặt--chạy-dự-án)
- [Scripts](#scripts)
- [Triển khai](#triển-khai)

---

## Tổng quan

**VSTEPPro** là nền tảng luyện thi VSTEP trực tuyến dành cho người Việt Nam, hỗ trợ luyện tập 4 kỹ năng: **Listening, Reading, Writing, Speaking**. Ứng dụng mô phỏng sát format đề thi VSTEP thực tế, cung cấp hệ thống chấm điểm AI cho bài Writing, bài mẫu band 8+, và dashboard cá nhân hóa.

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

### 🗓️ Lịch thi VSTEP & Đăng ký
- Tra cứu lịch thi tại các trung tâm khảo thí trên toàn quốc
- Thông tin chi tiết: địa điểm, số chỗ, trạng thái đăng ký
- Luồng đăng ký & thanh toán (QR code)

### 🔐 Xác thực người dùng
- Đăng nhập / Đăng ký với email & mật khẩu
- Validation form đầy đủ (email format, password length, confirm password)
- Giao diện split-screen: branding panel + form panel

### 🛠️ Trang Admin
- Dashboard tổng quan: tổng user, đề thi, doanh thu, tỷ lệ hoàn thành
- Quản lý người dùng (CRUD, search, filter)
- Quản lý đề thi (thêm/sửa/xoá theo từng skill)
- Sidebar navigation

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

## Cấu trúc dự án

```
vstep-pathfinder-hub/
├── src/
│   ├── assets/             # Tài nguyên hình ảnh tĩnh
│   ├── components/         # Component UI tái sử dụng toàn cục
│   │   ├── ui/             # Thư viện component của shadcn/ui
│   │   ├── PageTransition.tsx  # Hiệu ứng chuyển trang mượt mà
│   │   ├── SmoothScroll.tsx    # Cuộn mượt mà sử dụng Lenis
│   │   └── StaggerChildren.tsx # Hiệu ứng xuất hiện tuần tự
│   ├── features/           # Kiến trúc chia nhỏ theo Module/Feature
│   │   ├── auth/           # Xác thực & Phân quyền đăng nhập
│   │   ├── dashboard/      # Dashboard tiến độ cá nhân & Đổi thưởng
│   │   ├── admin/          # Quản lý danh sách học viên & Đề thi
│   │   ├── registration/   # Tra cứu lịch thi & Đăng ký VietQR
│   │   ├── landing/        # Các section chính trên Landing Page
│   │   ├── quiz/           # Trắc nghiệm, chấm Writing & Speaking AI
│   │   └── attempts/       # Lượt thi, Review chi tiết & Transition [NEW]
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Config & Utilities chung
│   ├── pages/              # Các trang tiện ích (NotFound, ...)
│   ├── services/           # Service nền tảng & apiClient Backend-Ready [NEW]
│   ├── App.tsx             # Định nghĩa cấu trúc Routes chính
│   ├── main.tsx            # Điểm khởi chạy của dự án
│   └── index.css           # Global CSS & Design system Tokens
```

---

## Các trang & Route

| Route | Trang | Mô tả |
|---|---|---|
| `/` | Index | Landing page chính |
| `/auth` | Auth | Đăng nhập & Đăng ký tài khoản |
| `/dashboard` | Dashboard | Dashboard cá nhân hóa, streak & cửa hàng quà tặng |
| `/quiz` | Quiz | Lựa chọn kỹ năng (L/R/W/S) & chế độ làm bài (Luyện tập / Thi thử) |
| `/mock-test` | MockTestLanding | [NEW] Landing page thi thử toàn diện VSTEP |
| `/quiz/listening/take` | ListeningQuiz | Giao diện thi Listening (chốt chặn tua/pause trong Thi thử) |
| `/quiz/reading/take` | ReadingQuiz | Giao diện thi Reading song song |
| `/quiz/writing/take` | WritingQuiz | Giao diện thi Writing kèm bộ đếm từ & chấm điểm AI |
| `/quiz/speaking/take` | SpeakingQuiz | Giao diện thi Speaking ghi âm & AI feedback |
| `/attempts/:attemptId/result` | AttemptResult | [NEW] Bảng điểm kết quả bài làm tổng quan, xếp band VSTEP |
| `/attempts/:attemptId/review` | AttemptReview | [NEW] Xem lại đáp án đúng, giải thích & transcript bài làm |
| `/mock-test/review` | MockTestReviewRedirect | [NEW] Redirect tương thích ngược về kết quả bài làm gần nhất |
| `/vstep-registration` | VstepRegistration | Lịch thi VSTEP trên toàn quốc & QR thanh toán |
| `/admin` | Admin | Quản trị học viên & Đề thi (Step-based forms) |
| `/results` | Results | Trang xếp hạng điểm số & đánh giá học viên |
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

### Quy ước màu sắc
| Loại lỗi | Màu | CSS class |
|---|---|---|
| Grammar | 🟡 Vàng | `bg-yellow-200` |
| Vocabulary | 🟠 Cam | `bg-orange-200` |
| Spelling | 🔴 Đỏ | `bg-red-200` |
| Coherence | 🔵 Xanh | `bg-blue-200` |

### Tiêu chí chấm (4 criteria)
1. **Task Achievement** – Hoàn thành yêu cầu đề bài
2. **Coherence & Cohesion** – Mạch lạc & liên kết
3. **Lexical Resource** – Vốn từ vựng
4. **Grammar Range & Accuracy** – Ngữ pháp

---

## Thiết kế & Design System

### Font
- **Be Vietnam Pro** (Google Fonts) – weights: 400, 500, 600, 700, 800

### Color Tokens (HSL)
```css
--primary: 217 91% 50%;       /* Blue chính */
--accent: 174 62% 47%;        /* Teal accent */
--background: 210 33% 98%;    /* Nền sáng */
--foreground: 215 25% 15%;    /* Text chính */
--muted: 210 33% 95%;         /* Nền phụ */
--destructive: 0 84% 60%;     /* Đỏ cảnh báo */
```

### Gradient
```css
--hero-gradient: linear-gradient(135deg, hsl(217 91% 50%), hsl(217 91% 40%));
```

### Shadows
```css
--card-shadow: 0 4px 24px -4px hsl(217 91% 50% / 0.08);
--card-shadow-hover: 0 8px 32px -4px hsl(217 91% 50% / 0.15);
```

---

## Cài đặt & Chạy dự án

### Yêu cầu
- Node.js >= 18
- npm hoặc bun

### Cài đặt

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Cài đặt dependencies
npm install
# hoặc
bun install
```

### Chạy development server

```bash
npm run dev
# hoặc
bun run dev
```

Mở trình duyệt tại `http://localhost:8080`

### ⚙️ Cấu hình Môi trường (Environment Variables)

Ứng dụng hỗ trợ chuyển đổi linh hoạt giữa dữ liệu **Mock** (chạy không cần Backend) và dữ liệu **API thật** bằng cách cấu hình các tệp `.env.local` hoặc `.env.production`:

```bash
# Nguồn dữ liệu sử dụng: "mock" hoặc "api" (mặc định là "mock")
VITE_DATA_SOURCE=mock

# Base URL của Backend API (khi cấu hình VITE_DATA_SOURCE=api)
VITE_API_BASE_URL=https://api.vsteppro.edu.vn/api/v1
```

*Để có thêm hướng dẫn kết nối API và thứ tự ưu tiên tích hợp Backend, vui lòng tham khảo [Frontend Backend-Ready Guide](docs/FRONTEND_BACKEND_READY.md).*

---

## Scripts

| Script | Mô tả |
|---|---|
| `npm run dev` | Khởi chạy dev server (port 8080) |
| `npm run build` | Build production |
| `npm run build:dev` | Build development mode |
| `npm run preview` | Preview bản build |
| `npm run lint` | Chạy ESLint |
| `npm run test` | Chạy test (Vitest) |
| `npm run test:watch` | Chạy test ở watch mode |

---

## Triển khai

### Qua Lovable
Mở [Lovable Project](https://lovable.dev) → **Share** → **Publish**

### Custom Domain
Project > Settings > Domains > Connect Domain

Xem thêm: [Hướng dẫn custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 📄 License

© 2024 VSTEPPro. All rights reserved.
