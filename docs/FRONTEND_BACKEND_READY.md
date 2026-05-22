# Frontend Backend-Ready Guide — VSTEPPro

Tài liệu này hướng dẫn cách chuyển VSTEPPro từ **mock data** (hiện tại) sang **API backend thật** khi backend sẵn sàng.

---

## Kiến trúc Service Layer

```
src/services/
├── api-client.ts            ← HTTP client chung (fetch wrapper + auth token)
└── data-source.ts           ← Đọc VITE_DATA_SOURCE, export isMockDataSource / isApiDataSource

src/features/attempts/services/
├── attempts.mock-service.ts ← Implement bằng localStorage (đang dùng)
├── attempts.api-service.ts  ← Implement bằng real API (ready, chờ BE)
└── attempts.service.ts      ← Dispatcher: chọn mock hoặc api theo env
```

**Nguyên tắc**: Component không bao giờ import trực tiếp mock hay api service.
Luôn import `attemptsService` từ `attempts.service.ts`.

---

## Cách chuyển FE từ Mock sang API

### Bước 1 — Cấu hình environment

Tạo file `.env.local` (hoặc `.env.production`) với nội dung:

```bash
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=https://api.vsteppro.edu.vn/api/v1
```

> Tham khảo `.env.example` để xem tất cả các env variable được hỗ trợ.

### Bước 2 — Xác nhận không còn mock data nào được dùng

Khi `VITE_DATA_SOURCE=api`, tự động dùng `attemptsApiService` thay cho `attemptsMockService`.
Không cần sửa bất kỳ component hay page nào.

### Bước 3 — Inject auth token (sau khi có login API)

```typescript
// Sau khi người dùng đăng nhập thành công:
import { apiClient } from "@/services/api-client";
apiClient.authToken = response.data.accessToken;
```

Token sẽ được tự động thêm vào header `Authorization: Bearer <token>` cho mọi request tiếp theo.

---

## Danh sách service đã sẵn sàng API

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

---

## Thứ tự ưu tiên BE implement

Backend cần implement các endpoint theo thứ tự ưu tiên:

### Ưu tiên cao (P0) — Bắt buộc để chạy được app

| Endpoint | Lý do ưu tiên |
|----------|---------------|
| `POST /attempts/start` | Khởi tạo lượt làm bài — bước đầu tiên của mọi flow |
| `PATCH /attempts/:id/skill` | Lưu câu trả lời — cốt lõi của Practice và Mock Test |
| `POST /attempts/:id/finish` | Kết thúc Mock Test và tính điểm tổng hợp |
| `GET /attempts/:id/result` | Hiển thị màn hình kết quả `AttemptResult.tsx` |
| `GET /attempts/:id` | Khôi phục tiến trình làm bài khi F5 |

### Ưu tiên trung (P1) — Cần cho Review

| Endpoint | Lý do ưu tiên |
|----------|---------------|
| `GET /attempts/:id/review` | Xem lại chi tiết bài làm `AttemptReview.tsx` |
| `POST /attempts/:id/speaking/upload` | Thay thế blob URL tạm thời bằng URL vĩnh viễn |

### Ưu tiên thấp (P2) — AI Grading

| Endpoint | Lý do ưu tiên |
|----------|---------------|
| `POST /attempts/:id/writing/submit` | Chấm điểm Writing qua AI — hiện đang mock |

---

## Lưu ý về Speaking Blob URL

**Vấn đề hiện tại**: Khi người dùng ghi âm trong SpeakingQuiz, browser tạo một **Blob URL tạm thời** (ví dụ: `blob:http://localhost:5173/abc123`). URL này:

- ✅ Hoạt động trong cùng phiên trình duyệt
- ❌ **Mất ngay khi người dùng F5 trang** — Blob bị thu hồi khỏi bộ nhớ

**Giải pháp khi có Backend**:

1. Sau khi ghi âm xong, gọi `attemptsService.uploadSpeakingRecording(attemptId, partId, blob)`.
2. API `POST /attempts/:id/speaking/upload` nhận file, upload lên Cloud Storage (S3/GCS/Firebase).
3. Trả về permanent URL (vd: `https://storage.vsteppro.edu.vn/...`).
4. FE lưu URL này vào `recordings` state và vào attempt data.
5. Khi F5, URL cloud storage vẫn hoạt động bình thường.

**Fallback UI đã có sẵn**: `SpeakingReview.tsx` đã xử lý trường hợp audio playback lỗi sau F5 — hiển thị cảnh báo thân thiện thay vì crash:

```
⚠️ Không thể phát lại bản ghi âm này. Nếu bạn đã tải lại trang (F5), 
các Blob URL tạm thời trong bộ nhớ của trình duyệt đã bị thu hồi. 
Tính năng tải tệp tin lên Cloud Storage sẽ được xử lý khi tích hợp API Backend.
```

---

## Môi trường chạy

| Env | VITE_DATA_SOURCE | Mô tả |
|-----|-----------------|-------|
| Development (default) | `mock` | Dùng localStorage, không cần BE |
| Staging/Production | `api` | Gọi real API, cần set `VITE_API_BASE_URL` |

---

## TypeScript Types mapping

Response từ API Backend phải khớp với interface sau (đã định nghĩa tại `src/features/attempts/types.ts`):

```typescript
interface MockTestAttempt {
  id: string;
  mode: "practice" | "mock_test";
  startedAt: number;
  finishedAt?: number;
  skills: Partial<Record<Skill, SkillAttempt>>;
  overallScore?: number;
  level?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendedPractice?: string[];
}
```

Xem toàn bộ schema tại [`src/features/attempts/types.ts`](../src/features/attempts/types.ts).
Xem chi tiết payload tại [`docs/API_CONTRACT.md`](./API_CONTRACT.md).

---

## Báo cáo Kiểm tra Hồi quy & Các lỗi đã khắc phục (Regression Audit & Hotfixes Summary)

Trong đợt **Regression Audit** cuối cùng chuẩn bị cho quá trình kết nối với API Backend thực tế, chúng tôi đã phát hiện và khắc phục triệt để **4 lỗi logic & cấu trúc nghiêm trọng** để đảm bảo ứng dụng VSTEPPro vận hành ổn định 100%.

### 1. Báo cáo 4 lỗi quan trọng đã khắc phục (Hotfixes)

#### 🐞 1. Lỗi nhận diện chế độ mong manh (Fragile Mode Detection)
* **Vị trí**: `src/features/attempts/services/attempts.mock-service.ts`
* **Nguyên nhân**: Hàm `saveSkillAttempt` ban đầu chỉ check URL query string hoặc path (`mode=mock_test`) để quyết định mode. Khi người dùng reload trang (F5) hoặc điều hướng mà URL bị mất param này, service sẽ tự động hạ bậc chế độ xuống `"practice"`.
* **Hậu quả**: Khi hạ xuống `"practice"`, hệ thống gọi ngay `finalizeAttempt`, đóng bài thi thử thiêng liêng và xếp bậc VSTEP sớm khi học viên chỉ vừa nộp xong một kỹ năng duy nhất.
* **Khắc phục**: Thay đổi logic để **ưu tiên đọc thuộc tính `mode` từ lượt thi đang hoạt động (active attempt)** trong `localStorage` trước. Chỉ khi là lượt thi mới chưa từng lưu, hệ thống mới phân tích URL để đảm bảo an toàn tuyệt đối.

#### 🐞 2. Lỗi crash chế độ Luyện tập ở API Mode khi thiếu `attemptId`
* **Vị trí**: `src/features/attempts/services/attempts.api-service.ts`
* **Nguyên nhân**: Khi làm bài tập luyện tập đơn lẻ (Practice Mode), học viên vào thẳng trang làm bài mà không gọi `startAttempt` để tạo `attemptId` trong `sessionStorage`. Khi nộp bài, `api-service` cố gắng đọc `attemptId` và ném lỗi crash ứng dụng vì không tìm thấy ID.
* **Hậu quả**: Học viên không thể luyện tập hoặc nộp bài từng kỹ năng riêng lẻ khi kết nối API thật.
* **Khắc phục**: Tôi đã bổ sung logic tự động khôi phục / khởi tạo: Nếu `attemptId` trống trong `sessionStorage`, `api-service` sẽ **tự động gọi API khởi tạo một lượt luyện tập mới** dạng `"practice"` trên server, lưu ID vào session và tiếp tục patch lưu bài tập mượt mà.

#### 🐞 3. Lỗi lưu Blob URL tạm thời ở kỹ năng Speaking
* **Vị trí**: `src/features/quiz/speaking/pages/SpeakingQuiz.tsx`
* **Nguyên nhân**: Khi ghi âm, trình duyệt tạo ra một URL tạm dạng `blob:http://...`. Nếu gửi thẳng chuỗi này vào payload `saveSkillAttempt` lên backend, backend sẽ lưu một URL rác vô dụng, và file ghi âm sẽ mất vĩnh viễn khi người dùng F5 hoặc đóng tab.
* **Hậu quả**: Không lưu được dữ liệu bài nói thật của học viên lên máy chủ, gây lỗi 404 khi xem lại bài.
* **Khắc phục (Speaking Upload Flow)**:
  - **Sử dụng tệp nhị phân thật**: State `recordingBlobs` sẽ lưu giữ đối tượng `Blob` thật của từng phần thi nói.
  - **Quy trình gửi bài (Speaking Upload Flow)**:
    $$\text{Blob/File nhị phân thật} \xrightarrow{\text{attemptsService.uploadSpeakingRecording}} \text{Permanent Cloud Storage URL} \xrightarrow{\text{saveSkillAttempt}} \text{Database}$$
  - **Cơ chế xử lý lỗi UI khi Upload thất bại**:
    - Khi upload bị lỗi (mất mạng, server hỏng), hệ thống sử dụng thư viện `toast` từ `sonner` để hiển thị thông báo lỗi trực quan: *"Tải file ghi âm Speaking thất bại. Vui lòng kiểm tra kết nối mạng!"*.
    - **Xóa bỏ hoàn toàn URL blob tạm thời** khỏi danh sách `recordings` được lưu để tránh lưu các URL blob hỏng vô giá trị vào cơ sở dữ liệu.
    - Học viên vẫn giữ lại file ghi âm cục bộ trong phiên làm việc hiện tại để có thể nhấn thử lại (retry) khi mạng ổn định.

#### 🐞 4. Cảnh báo ESLint & Lỗi stale closure trong `MockTestTransition.tsx`
* **Vị trí**: `src/features/attempts/components/MockTestTransition.tsx`
* **Nguyên nhân**: Hàm `handleNavigate` gọi điều hướng trong `setInterval` của `useEffect` nhưng không được bọc bằng `useCallback`, dẫn đến cảnh báo biên dịch React Hook nghiêm trọng và nguy cơ chuyển trang sai hướng/đơ trang.
* **Khắc phục**: Bọc `handleNavigate` trong `useCallback` với dependencies đầy đủ và dọn dẹp interval sạch sẽ khi unmount, sử dụng `hasNavigated.current` làm chốt chặn an toàn chống double-navigation.

---

### 2. Cách kiểm thử và Biên dịch (Verification)

#### Kiểm tra chế độ Mock (Mặc định)
1. Đảm bảo file `.env.local` chưa được tạo hoặc chứa `VITE_DATA_SOURCE=mock`.
2. Chạy lệnh biên dịch:
   ```bash
   npm run build
   ```
   Xác nhận build thành công không lỗi.

#### Kiểm tra chế độ API (Backend-Ready)
1. Đặt cấu hình môi trường tạm thời:
   ```bash
   VITE_DATA_SOURCE=api
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   ```
2. Chạy lệnh biên dịch:
   ```bash
   npm run build
   ```
   Đảm bảo không phát sinh bất kỳ lỗi TypeScript, import sai, hay thiếu interface nào.

