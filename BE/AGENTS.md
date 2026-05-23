# AGENT.md — VAI Backend Coding Guide



## 1. Project Overview



Dự án **VAIApplication** là backend cho hệ thống web ôn luyện thi tiếng Anh VSTEP tích hợp AI.



Mục tiêu chính:



- Luyện tập và tự động chấm điểm 3 kỹ năng: **Reading, Writing, Speaking**.

- Tối ưu chi phí vận hành hạ tầng và chi phí API AI ở mức tối đa.

- Backend xây dựng theo kiến trúc **N-Layer**.



## 2. Technology Stack



- **Backend:** C# — ASP.NET Core Web API

- **Architecture:** N-Layer gồm API Layer, Business Logic Layer, Data Access Layer

- **Database:** Supabase PostgreSQL

- **ORM:** Entity Framework Core

- **Authentication:** JWT Access Token + Refresh Token + Email OTP Verification
- **Mapping:** AutoMapper
- **Configuration:** `.env` for local secrets via DotNetEnv, environment variables/Docker secrets for production

- **Storage:**

  - Supabase Storage: lưu file tĩnh, hình ảnh đề thi, tài nguyên đọc/nghe

  - Cloudflare R2: lưu audio Speaking qua Presigned URL

- **Realtime:** SignalR/WebSocket

- **Payment:** VNPay / MoMo

- **AI Model:** Chỉ dùng `gemini-1.5-flash`

- **Background Jobs:** Worker Service
- **Soft Delete:** Enabled for entities that should not be physically deleted
- **Deployment:** Docker / Docker Compose



## 3. Current Solution Structure



```txt

VAIApplication.sln

├── VAIApplication              # API Layer

├── BusinessLogicLayer          # BLL

└── DataAccessLayer             # DAL

```



## 4. Project Layer Responsibilities



### 4.1 VAIApplication — API Layer



Chỉ chịu trách nhiệm tiếp nhận request, validate đầu vào cơ bản, gọi service ở BLL và trả response.



Thư mục chính:



```txt

VAIApplication

├── Controllers

├── Extensions

├── Hubs

├── Middlewares

├── Program.cs

├── appsettings.json

└── Dockerfile

```



Quy tắc:



- Controller không chứa business logic.

- Controller không gọi trực tiếp DbContext hoặc Repository.

- Controller chỉ gọi interface service từ BLL.

- Không trả Entity trực tiếp ra API.

- Luôn dùng DTO cho request/response.

- Các phần đăng ký service nên tách vào `Extensions/` để giữ `Program.cs` gọn.



Ví dụ luồng đúng:



```txt

Controller -> IService trong BLL -> Repository/UoW trong DAL -> Database

```



Ví dụ không được làm:



```txt

Controller -> DbContext

Controller -> Repository

Controller -> Gemini API

Controller -> R2 Client

```



### 4.2 BusinessLogicLayer — BLL



Chứa toàn bộ logic nghiệp vụ của hệ thống.



Thư mục chính:



```txt

BusinessLogicLayer

├── Core

├── DTOs

├── Integrations

└── Services

    ├── Implements

    └── Interfaces

```



Quy tắc:



- Service xử lý logic nghiệp vụ.

- Service nhận DTO request và trả DTO response.

- Service không trả Entity ra ngoài API.

- Service được phép gọi Repository/UoW thông qua interface.

- Service được phép gọi các integration service như AI, Storage, Payment.

- Không viết SQL hoặc truy vấn EF Core trực tiếp trong Controller.



Nên chia DTO theo từng feature:



```txt

DTOs

├── Auth

├── Exam

├── Reading

├── Writing

├── Speaking

├── Payment

└── Common

```



Nên chia service theo từng feature:



```txt

Services

├── Interfaces

│   ├── IAuthService.cs

│   ├── IExamService.cs

│   ├── IWritingService.cs

│   ├── ISpeakingService.cs

│   └── IPaymentService.cs

└── Implements

    ├── AuthService.cs

    ├── ExamService.cs

    ├── WritingService.cs

    ├── SpeakingService.cs

    └── PaymentService.cs

```



### 4.3 DataAccessLayer — DAL



Chỉ chịu trách nhiệm thao tác database.



Thư mục chính:



```txt

DataAccessLayer

├── Context

├── Core

├── Entities

├── Repositories

└── UoW

```



Quy tắc:



- DAL chứa Entity, DbContext, Repository, Unit of Work.

- DAL không gọi BLL.

- DAL không chứa business logic cấp cao.

- Repository chỉ xử lý truy vấn database.

- UoW quản lý transaction và `SaveChangesAsync()`.

- Không expose `IQueryable` tùy tiện lên BLL nếu không cần thiết.



## 5. Dependency Rules



Luồng phụ thuộc bắt buộc:



```txt

VAIApplication -> BusinessLogicLayer -> DataAccessLayer

```



Không được tạo dependency ngược:



```txt

DataAccessLayer -> BusinessLogicLayer     # Sai

DataAccessLayer -> VAIApplication         # Sai

BusinessLogicLayer -> VAIApplication      # Sai

```



## 6. Repository Pattern Rules



Sử dụng Repository Pattern để tách logic truy vấn khỏi service.



Có thể dùng Generic Repository cho thao tác cơ bản:



```csharp

Task<T?> GetByIdAsync(Guid id);

Task AddAsync(T entity);

void Update(T entity);

void Delete(T entity);

```



Nhưng với truy vấn nghiệp vụ quan trọng, ưu tiên Specific Repository.



Ví dụ:



```csharp

public interface IUserRepository

{

    Task<User?> GetByEmailAsync(string email);

    Task<bool> IsEmailExistsAsync(string email);

}

```



```csharp

public interface IExamRepository

{

    Task<Exam?> GetExamDetailAsync(Guid examId);

    Task<List<Exam>> GetPublishedExamsAsync(int page, int pageSize);

}

```



Quy tắc tối ưu EF Core:



- Chỉ `Select` đúng cột cần dùng.

- Không `Include` bừa bãi.

- Dùng `AsNoTracking()` cho query chỉ đọc.

- Dùng phân trang cho danh sách lớn.

- Không load Entity lớn nếu chỉ cần vài field.

- Không trả toàn bộ bảng về memory rồi mới filter.



## 7. Unit of Work Rules



Bắt buộc dùng Unit of Work cho các luồng cần transaction.



Đặc biệt:



- Thanh toán VNPay/MoMo

- Cập nhật ví / điểm / gói VIP

- Tạo attempt bài thi kèm nhiều bảng con

- Lưu kết quả chấm Writing/Speaking



Ví dụ luồng payment:



```txt

Verify payment callback

-> Check transaction exists

-> Update payment status

-> Update user balance/subscription

-> SaveChangesAsync trong cùng transaction

```



Không được cập nhật payment và ví ở hai transaction rời nhau.



## 8. DTO Rules



Tất cả API input/output phải dùng DTO.



Không được trả Entity trực tiếp:



```csharp

return Ok(user); // Sai nếu user là Entity

```



Nên trả DTO:



```csharp

return Ok(userProfileResponse);

```



DTO nên ngắn gọn, chỉ chứa field cần thiết để giảm payload.



Ví dụ:



```csharp

public class WritingScoreResponse

{

    public decimal Score { get; set; }

    public string Feedback { get; set; } = string.Empty;

}

```



## 9. AI Integration Rules



Chỉ sử dụng model:



```txt

gemini-1.5-flash

```



Không tự ý đổi sang model đắt hơn nếu không có yêu cầu rõ ràng.



### Writing AI Optimization



- Prompt phải ngắn.

- Không gửi dữ liệu dư thừa.

- Output bắt buộc là JSON ngắn.

- Chỉ trả điểm và 1–2 câu nhận xét cốt lõi.



Ví dụ output schema:



```json

{

  "score": 7.0,

  "feedback": "Good organization, but grammar errors reduce clarity."

}

```



Không yêu cầu AI trả feedback dài nếu không cần.



### Speaking AI Optimization



- Không gọi AI nhiều lần cho từng câu nhỏ.

- Gom toàn bộ bài Speaking thành một file/luồng.

- Chỉ gọi AI chấm một lần duy nhất ở cuối bài.

- Client phải nén audio sang Opus/WebM khoảng 16kbps trước khi upload.



## 10. Storage Rules



### Supabase Storage



Dùng cho:



- Hình ảnh đề thi

- File tĩnh

- Tài nguyên Reading/Listening

- Avatar hoặc asset nhỏ



Yêu cầu:



- Áp dụng RLS nếu file cần bảo vệ.

- Không lưu audio Speaking dung lượng lớn ở Supabase nếu có thể dùng R2.



### Cloudflare R2



Dùng cho:



- Audio bài Speaking



Quy tắc:



- Client upload trực tiếp lên R2 bằng Presigned URL.

- Backend chỉ sinh Presigned URL, không nhận file audio lớn qua API nếu không cần.

- Tận dụng Zero Egress Fee của R2 để giảm chi phí.

- Có cronjob dọn file tài khoản Free sau 7–14 ngày.

- Tài khoản VIP có thể giữ file lâu dài hoặc vĩnh viễn tùy business rule.



## 11. Payment Rules



PaymentService phải xử lý qua Unit of Work.



Các rule bắt buộc:



- Validate callback từ VNPay/MoMo.

- Kiểm tra giao dịch đã xử lý chưa để tránh cộng tiền/gói nhiều lần.

- Update payment status và user wallet/subscription trong cùng transaction.

- Log đầy đủ request/response callback.

- Không tin dữ liệu amount/package từ client khi xác nhận thanh toán.

- Lấy thông tin gói từ database/server-side.



## 12. Authentication Rules



- Sử dụng JWT Access Token + Refresh Token.

- Access Token sống ngắn.

- Refresh Token lưu an toàn trong database.

- Có cơ chế revoke refresh token khi logout.

- Middleware/API phải validate user status nếu cần.

- Không lưu secret trong source code.

- Role hiện tại:
  - `admin`
  - `staff`
  - `user`

- Gói user hiện tại:
  - `free`
  - `weekly`
  - `monthly`

- User mới mặc định:
  - `Role = "user"`
  - `SubscriptionPlan = "free"`

### 12.1 Email OTP Verification Rules

- User bắt buộc xác thực email bằng OTP trước khi được login.

- OTP gửi qua email SMTP.

- OTP gồm 6 chữ số.

- OTP hết hạn sau 5 phút, cấu hình qua `.env`.

- Không lưu OTP plain text trong database.

- Bắt buộc lưu OTP dạng hash:

```csharp
EmailOtpHash = BCrypt.Net.BCrypt.HashPassword(otp);
```

- Verify OTP bằng:

```csharp
BCrypt.Net.BCrypt.Verify(inputOtp, user.EmailOtpHash);
```

- Sau khi verify OTP thành công:
  - `EmailConfirmed = true`
  - `EmailOtpHash = null`
  - `EmailOtpExpiryTime = null`
  - reset số lần nhập sai OTP nếu có

- Không cho login nếu:

```csharp
user.EmailConfirmed == false
```

- Resend OTP phải tạo OTP mới và ghi đè OTP cũ.

- Nên chống spam resend OTP bằng `OtpLastSentAt`.

- Nên chống brute force OTP bằng `OtpFailedCount`.

### 12.2 User Auth Entity Fields

Khi thêm xác thực OTP, User entity nên có các field:

```csharp
public bool EmailConfirmed { get; set; }
public string? EmailOtpHash { get; set; }
public DateTime? EmailOtpExpiryTime { get; set; }
public int OtpFailedCount { get; set; }
public DateTime? OtpLastSentAt { get; set; }
```

Không dùng field `EmailOtp` lưu OTP plain text.

### 12.3 Auth Endpoints Required

AuthController cần có tối thiểu:

```txt
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
```

Mọi endpoint phải trả `ApiResponse<T>` và có Swagger summary.



## 13. SignalR Rules



SignalR dùng cho realtime nếu cần:



- Trạng thái upload/chấm điểm Speaking

- Notification

- Tiến trình xử lý bài thi



Không dùng SignalR cho việc truyền file lớn nếu upload trực tiếp lên R2 đã đủ.



## 14. Error Handling Rules



- Dùng Global Exception Middleware.

- Không throw exception thô ra client.

- Response lỗi nên có format thống nhất.



Ví dụ:



```json

{

  "success": false,

  "message": "Invalid request",

  "errors": \[]

}

```



## 15. API Response Rules



Nên dùng response wrapper thống nhất:



```csharp

public class ApiResponse<T>

{

    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public T? Data { get; set; }

    public object? Errors { get; set; }

}

```



Không trả dữ liệu thừa.




## 16. API Summary / Swagger Documentation Rules

Tất cả API endpoint phải có **summary** rõ ràng để Swagger/OpenAPI dễ đọc và dễ test.

### Controller Action Summary

Mỗi action trong Controller bắt buộc có XML comment:

```csharp
/// <summary>
/// Đăng ký tài khoản mới và gửi OTP xác thực email.
/// </summary>
/// <param name="request">Thông tin đăng ký tài khoản.</param>
/// <returns>Thông tin xác thực hoặc thông báo yêu cầu xác thực OTP.</returns>
[HttpPost("register")]
[ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
public async Task<IActionResult> Register([FromBody] RegisterRequest request)
{
    ...
}
```

### Summary Content Rules

Summary phải ngắn gọn nhưng đủ ý:

- Endpoint dùng để làm gì.
- Input chính là gì.
- Output chính là gì.
- Có yêu cầu authentication/role không.
- Có side effect quan trọng không, ví dụ gửi OTP, tạo payment, tạo presigned URL upload R2.

Ví dụ tốt:

```csharp
/// <summary>
/// Xác thực OTP email sau khi đăng ký tài khoản.
/// </summary>
```

Ví dụ không tốt:

```csharp
/// <summary>
/// Verify.
/// </summary>
```

### Swagger Response Rules

Mỗi endpoint nên khai báo response status bằng `ProducesResponseType`.

Tối thiểu nên có:

```csharp
[ProducesResponseType(typeof(ApiResponse<T>), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
```

Với endpoint tạo mới dữ liệu, dùng:

```csharp
[ProducesResponseType(typeof(ApiResponse<T>), StatusCodes.Status201Created)]
```

### Swagger Configuration

API Layer phải bật XML comment trong Swagger.

Trong `.csproj` của API project:

```xml
<PropertyGroup>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
```

Trong Swagger extension:

```csharp
var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
options.IncludeXmlComments(xmlPath);
```

Nếu dùng annotation thì cài:

```bash
dotnet add VAIApplication package Swashbuckle.AspNetCore.Annotations
```

và bật:

```csharp
options.EnableAnnotations();
```

### Naming Convention For API Summary

- Summary nên viết bằng tiếng Việt nếu document của project đang dùng tiếng Việt.
- Không viết summary quá dài.
- Không ghi thông tin nhạy cảm như secret, connection string, token thật trong summary.

## 17. Naming Rules



- Project giữ đúng N-Layer hiện tại:

  - `VAIApplication`

  - `BusinessLogicLayer`

  - `DataAccessLayer`

- Interface bắt đầu bằng `I`.

- Service implement kết thúc bằng `Service`.

- Repository implement kết thúc bằng `Repository`.

- DTO request kết thúc bằng `Request`.

- DTO response kết thúc bằng `Response`.



Ví dụ:



```txt

LoginRequest.cs

LoginResponse.cs

IAuthService.cs

AuthService.cs

IUserRepository.cs

UserRepository.cs

IUnitOfWork.cs

UnitOfWork.cs

```



## 18. Environment Variables Rules

Không hardcode secret trong source code.

Bắt buộc dùng `.env` cho local development và environment variables/Docker secrets cho production.

File `.env` phải nằm ở root solution và phải được đưa vào `.gitignore`.

Không commit `.env` lên GitHub.

Local `.env` mẫu:

```env
ASPNETCORE_ENVIRONMENT=Development

DB_CONNECTION_STRING=Host=localhost;Port=5432;Database=Vai;Username=postgres;Password=12345;Pooling=true;Trust Server Certificate=true;

JWT_KEY=YOUR_SUPER_SECRET_KEY_AT_LEAST_32_CHARACTERS
JWT_ISSUER=VAIApplication
JWT_AUDIENCE=VAIApplicationUsers
JWT_DURATION_MINUTES=60

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_google_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=VAI Application

OTP_EXPIRE_MINUTES=5
```

Bắt buộc dùng `IOptions<T>` cho config có cấu trúc.

Ví dụ config class:

```csharp
public class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
}
```

Program.cs phải load `.env` sớm:

```csharp
DotNetEnv.Env.Load();
builder.Configuration.AddEnvironmentVariables();
```

Package cần dùng:

```bash
dotnet add VAIApplication package DotNetEnv
dotnet add BusinessLogicLayer package MailKit
```

## 19. DateTime / Timezone Rules

PostgreSQL với Npgsql 6+ yêu cầu datetime rõ ràng khi dùng `timestamp with time zone`.

Bắt buộc lưu database theo UTC.

Tuyệt đối không dùng:

```csharp
DateTime.Now
```

Bắt buộc dùng:

```csharp
DateTime.UtcNow
```

Áp dụng cho:

- `CreatedAt`
- `UpdatedAt`
- `DeletedAt`
- `RefreshTokenExpiryTime`
- `EmailOtpExpiryTime`
- `OtpLastSentAt`
- `PaymentTime`
- `SubmissionTime`
- `ExpiredAt`
- Worker Service cleanup time

Chỉ convert sang giờ Việt Nam UTC+7 ở frontend hoặc response layer nếu cần hiển thị.

## 20. Code Style Rules



- Ưu tiên async/await cho database và external API.

- Không hardcode connection string, API key, secret.

- Dùng `IOptions<T>` cho cấu hình.

- Tách config vào `appsettings.json` hoặc environment variables.

- Không viết file quá dài nếu có thể chia nhỏ.

- Không để Controller xử lý mapping phức tạp.



## 21. Required Service Registration



Trong API Layer nên có extension methods như:



```txt

Extensions

├── ServiceCollectionExtensions.cs

├── AuthenticationExtensions.cs

├── SwaggerExtensions.cs

├── DatabaseExtensions.cs

└── CorsExtensions.cs

```



Ví dụ trong `Program.cs`:



```csharp

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();



builder.Services.AddDatabase(builder.Configuration);

builder.Services.AddApplicationServices();

builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddCorsPolicy(builder.Configuration);

```



## 22. CRUD Rules

Khi Codex được yêu cầu viết CRUD cho một feature, phải tuân thủ N-Layer:

```txt
Controller -> Service Interface -> Service Implement -> UnitOfWork/Repository -> DbContext
```

CRUD không được gọi trực tiếp DbContext trong Controller.

Mỗi CRUD feature nên có:

```txt
DTOs/<Feature>/
├── Create<Feature>Request.cs
├── Update<Feature>Request.cs
├── <Feature>Response.cs
└── <Feature>ListItemResponse.cs

Services/Interfaces/I<Feature>Service.cs
Services/Implements/<Feature>Service.cs

Repositories/Interfaces/I<Feature>Repository.cs
Repositories/Implements/<Feature>Repository.cs

Controllers/<Feature>Controller.cs
```

CRUD endpoint chuẩn:

```txt
GET    /api/<feature>
GET    /api/<feature>/{id}
POST   /api/<feature>
PUT    /api/<feature>/{id}
DELETE /api/<feature>/{id}
```

Quy tắc CRUD:

- Tất cả request/response dùng DTO.
- Không trả Entity trực tiếp.
- `GET list` phải có phân trang.
- Query read-only dùng `AsNoTracking()`.
- Chỉ `Select` đúng cột cần trả về.
- Delete mặc định là soft delete nếu entity có `IsDeleted`.
- Update chỉ cập nhật các field được phép.
- Mọi endpoint phải có XML summary và `ProducesResponseType`.
- Response dùng `ApiResponse<T>`.
- Dùng `DateTime.UtcNow` cho audit fields.
- Dùng AutoMapper cho mapping phổ biến, mapping thủ công nếu cần tối ưu query projection.

## 22. Cost Optimization Principles



Luôn ưu tiên giải pháp tiết kiệm chi phí:



- Giảm số lần gọi AI.

- Giảm token gửi vào AI.

- Giảm payload API.

- Giảm query database dư thừa.

- Client upload file trực tiếp lên storage.

- Backend không stream file lớn nếu không cần.

- Dùng R2 cho audio để giảm egress fee.

- Cronjob dọn file không cần thiết.



## 23. Things Not To Do



Không được:



- Chuyển kiến trúc sang Clean Architecture nếu không được yêu cầu.

- Thêm Domain Layer riêng nếu project vẫn đang theo N-Layer.

- Gọi trực tiếp DAL từ Controller.

- Trả Entity trực tiếp ra API.

- Gọi AI nhiều lần cho một bài Speaking.

- Upload audio lớn qua backend nếu có thể upload thẳng lên R2.

- Dùng model AI khác `gemini-1.5-flash` nếu chưa được duyệt.

- Lấy dư cột/dư bảng từ database.

- Viết business logic trong Controller.



## 24. Pending Decisions



Các thông tin sau cần được xác nhận thêm để hoàn thiện rule chi tiết:



- Tên database schema chính.

- Danh sách entity chính.

- Quy chuẩn response API cuối cùng.

- Quy chuẩn phân quyền chi tiết cho từng endpoint.

- Danh sách entity chính.

- Tên database schema chính.

- Giới hạn cụ thể từng gói `free`, `weekly`, `monthly`.

- Có dùng audit fields nâng cao không: `DeletedAt`, `CreatedBy`, `UpdatedBy`.



