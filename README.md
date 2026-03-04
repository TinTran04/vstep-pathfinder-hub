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
| **Be Vietnam Pro** | Font chữ chính (Google Fonts) |

---

## Cấu trúc dự án

```
src/
├── assets/                  # Hình ảnh tĩnh (hero dashboard, etc.)
├── components/
│   ├── ui/                  # shadcn/ui components (button, card, dialog, ...)
│   ├── AnnotatedText.tsx    # Component bôi màu lỗi Writing (AI feedback)
│   ├── Navbar.tsx           # Navigation bar chính
│   ├── HeroSection.tsx      # Hero section trang chủ
│   ├── VstepOverview.tsx    # Giới thiệu VSTEP
│   ├── BenefitsSection.tsx  # Lợi ích sử dụng
│   ├── SkillsSection.tsx    # 4 kỹ năng VSTEP
│   ├── LearningJourney.tsx  # Lộ trình học tập
│   ├── ExamSection.tsx      # Đề thi mô phỏng
│   ├── DashboardSection.tsx # Preview dashboard
│   ├── TestimonialSection.tsx # Đánh giá học viên
│   ├── PricingSection.tsx   # Bảng giá
│   ├── CTASection.tsx       # Call-to-action
│   └── FooterSection.tsx    # Footer
├── hooks/
│   ├── use-mobile.tsx       # Detect mobile viewport
│   └── use-toast.ts         # Toast notification hook
├── lib/
│   └── utils.ts             # Utility functions (cn helper)
├── pages/
│   ├── Index.tsx            # Landing page (trang chủ)
│   ├── Auth.tsx             # Đăng nhập / Đăng ký
│   ├── Dashboard.tsx        # Dashboard cá nhân
│   ├── Quiz.tsx             # Trang chọn kỹ năng & đề thi
│   ├── QuizTake.tsx         # Trang làm bài quiz chung
│   ├── ListeningQuiz.tsx    # Làm bài Listening (3 Parts, trắc nghiệm)
│   ├── ReadingQuiz.tsx      # Làm bài Reading (4 Passages, split-screen)
│   ├── WritingQuiz.tsx      # Làm bài Writing (2 Tasks, chấm AI)
│   ├── SpeakingQuiz.tsx     # Làm bài Speaking (3 Parts, ghi âm + AI)
│   ├── WritingSamples.tsx   # Bài mẫu Writing band 8+
│   ├── VstepRegistration.tsx # Lịch thi & đăng ký
│   ├── Admin.tsx            # Trang quản trị
│   ├── Results.tsx          # Kết quả & testimonials học viên
│   └── NotFound.tsx         # Trang 404
├── App.tsx                  # Root component & routing
├── main.tsx                 # Entry point
└── index.css                # Design tokens & global styles
```

---

## Các trang & Route

| Route | Trang | Mô tả |
|---|---|---|
| `/` | Index | Landing page với hero, giới thiệu, pricing, testimonials |
| `/auth` | Auth | Đăng nhập / Đăng ký (toggle) |
| `/dashboard` | Dashboard | Dashboard cá nhân hóa với biểu đồ tiến độ |
| `/quiz` | Quiz | Chọn kỹ năng (L/R/W/S) & đề thi, xem tổng quan hoặc danh sách đề |
| `/quiz/:skill/:id` | QuizTake | Làm bài quiz cụ thể |
| `/quiz/listening/take` | ListeningQuiz | Làm bài Listening mô phỏng VSTEP |
| `/quiz/reading/take` | ReadingQuiz | Làm bài Reading mô phỏng VSTEP |
| `/quiz/writing/take` | WritingQuiz | Làm bài Writing + chấm điểm AI |
| `/quiz/speaking/take` | SpeakingQuiz | Làm bài Speaking + ghi âm + AI |
| `/writing-samples` | WritingSamples | Bài mẫu Writing Task 1 & 2 (B1/B2) |
| `/vstep-registration` | VstepRegistration | Lịch thi VSTEP & đăng ký |
| `/admin` | Admin | Trang quản trị (users, đề thi, thống kê) |
| `/results` | Results | Bảng xếp hạng & đánh giá học viên |
| `*` | NotFound | Trang 404 |

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
