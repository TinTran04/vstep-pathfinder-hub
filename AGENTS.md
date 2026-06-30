# AGENTS.md - VAI Backend Coding Guide

## 1. Project Overview

VAIApplication is the ASP.NET Core backend for a VSTEP practice platform.

Core capabilities:
- Auth with JWT access token, refresh token, email OTP verification.
- User CRUD with role and subscription plan relationships.
- Exam management and Reading/Listening DOCX import.
- Reading and Listening practice.
- Writing and Speaking submission with provider-based AI grading and speech-to-text for Speaking.
- Personal Dictionary with PostgreSQL cache for dictionary and translation data.
- Subscription payment through payOS.
- Supabase PostgreSQL, Supabase Storage, and Cloudflare R2.

The architecture is strictly N-Layer:

```txt
VAIApplication -> BusinessLogicLayer -> DataAccessLayer
```

Do not convert this project to Clean Architecture. Do not add a Domain Layer.

## 2. Solution Structure

```txt
BE
+-- VAIApplication       # API Layer
+-- BusinessLogicLayer   # BLL
+-- DataAccessLayer      # DAL
```

API Layer:
- Controllers
- Extensions
- Middlewares
- Program.cs

BLL:
- DTOs
- Services/Interfaces
- Services/Implements
- Core/Settings
- Core/Mappings
- Integrations

DAL:
- Context
- Entities
- Repositories/Interfaces
- Repositories/Implements
- UoW
- Migrations

## 3. Dependency Rules

Allowed:

```txt
VAIApplication -> BusinessLogicLayer -> DataAccessLayer
```

Forbidden:

```txt
Controller -> DbContext
Controller -> Repository
BusinessLogicLayer service -> ApplicationDbContext
DataAccessLayer -> BusinessLogicLayer
DataAccessLayer -> VAIApplication
BusinessLogicLayer -> VAIApplication
```

Controllers must call only BLL service interfaces. Controllers must not contain business logic.

## 4. Technology Stack

- .NET 8 ASP.NET Core Web API
- EF Core + Npgsql
- Supabase PostgreSQL
- Repository Pattern + Unit of Work
- DTO pattern
- AutoMapper for common mapping only
- JWT auth + refresh token
- BCrypt for password and OTP hash
- DotNetEnv for local `.env`
- HttpClient for external APIs
- Cloudflare R2 for audio upload via presigned URL
- Supabase Storage for static/light assets
- Gemini/OpenRouter provider chain for Writing/Speaking AI grading
- Deepgram speech-to-text for Speaking
- payOS for subscription payments
- PostgreSQL-backed cache for Personal Dictionary

## 5. Identity and Database Rules

All primary keys and foreign keys use auto-increment `int`.

Correct:

```csharp
public int UserId { get; set; }
public int RoleId { get; set; }
public int SubscriptionPlanId { get; set; }
public int ExamId { get; set; }
```

Forbidden for primary/foreign keys:
- `Guid`
- `UUID`
- string IDs

EF identity columns must use:

```csharp
.ValueGeneratedOnAdd()
```

Routes must use int constraints:

```csharp
[HttpGet("{id:int}")]
```

Do not use `{id:guid}`.

## 6. Current Core Entities

Important entities:
- `User`
- `Role`
- `SubscriptionPlan`
- `Exam`
- `ExamSection`
- `ExamQuestion`
- `ExamOption`
- `ExamAttempt`
- `ExamAttemptAnswer`
- `WritingSubmission`
- `SpeakingSubmission`
- `DictionaryEntry`
- `UserVocabulary`
- `PaymentTransaction`
- `UserRewardLedger`
- `AiUsageLog`

Roles:

```txt
1 = admin
2 = staff
3 = user
```

Subscription plans:

```txt
1 = free    price 0      duration 0 days
2 = weekly  price 49000  duration 7 days
3 = monthly price 199000 duration 30 days
```

User defaults:

```csharp
RoleId = 3
SubscriptionPlanId = 1
```

Users must not store role/subscription names as strings. Use relationships:

```csharp
public int RoleId { get; set; }
public Role Role { get; set; } = null!;

public int SubscriptionPlanId { get; set; }
public SubscriptionPlan SubscriptionPlan { get; set; } = null!;
public DateTime? SubscriptionExpiresAt { get; set; }
```

## 7. Repository Rules

Repositories belong only in DAL.

Rules:
- Use specific repositories for feature queries.
- Do not expose `IQueryable` outside DAL.
- Use `AsNoTracking()` for read-only queries.
- Use projection with `Select` for list/query responses.
- Do not `Include` blindly.
- Do not load entire tables into memory before filtering.
- Add pagination for list endpoints.
- Use tracked repository methods for update/delete flows.
- Aggregate/admin dashboard queries must live in dedicated DAL repositories and return DAL projections.
- Do not use an oversized page such as `PageSize = 1000` as a replacement for a targeted repository query.

Example:

```csharp
Task<User?> GetByIdAsync(int userId);          // read
Task<User?> GetTrackedByIdAsync(int userId);   // write
```

## 8. Unit of Work Rules

Use `IUnitOfWork` for save and transaction boundaries.

Payment/webhook flows must update transaction and subscription in one DB transaction:

```txt
verify webhook signature
load transaction
reject mismatch
skip if already paid
update PaymentTransaction
update User.SubscriptionPlanId
update User.SubscriptionExpiresAt
SaveChangesAsync
commit
```

Use:

```csharp
Task ExecuteInTransactionAsync(Func<Task> operation);
```

## 9. DTO and API Response Rules

All API input/output must use DTOs.

Never return EF entities directly:

```csharp
return Ok(user); // forbidden if user is Entity
```

Use response wrapper:

```csharp
ApiResponse<T>
```

Error responses should stay consistent:

```json
{
  "success": false,
  "message": "Invalid request",
  "errors": {}
}
```

Every controller action should include:
- XML summary
- `ProducesResponseType`
- model validation
- `ApiResponse<T>`

## 10. Authentication Rules

Auth endpoints:

```txt
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/verify-reset-otp
POST /api/auth/reset-password
```

JWT must contain role name claim:

```csharp
new Claim(ClaimTypes.Role, user.Role.Name)
```

Do not allow login unless:

```csharp
user.EmailConfirmed == true
```

OTP:
- 6 digits.
- Expiry configured by `OTP_EXPIRE_MINUTES`.
- Store OTP hash only.
- Use BCrypt verify.
- Do not store plain OTP.
- Never write plaintext OTP values to console, structured logs, exception messages, or telemetry.

## 11. Exam and Practice Rules

Exam/practice IDs are int.

Routes:

```txt
GET  /api/exams/{id:int}
POST /api/reading-practice/{examId:int}/start
POST /api/listening-practice/{attemptId:int}/submit
POST /api/writing-practice/{examId:int}/submit
POST /api/speaking-practice/{examId:int}/submit
```

Free-user rules:
- Free users may be limited to one practice/submission where current service rules enforce it.
- Check free plan via `SubscriptionPlanId == 1` or `SubscriptionPlan.Name == "free"`.
- Do not compare a string field on `User`; no such field should exist.

## 12. Reading and Listening Import Rules

Reading import:

```txt
POST /api/exams/import-reading-docx
```

Listening import:

```txt
POST /api/exams/import-listening-docx
POST /api/exams/listening-audio/upload-url
```

Rules:
- Reading import service and Listening import service must remain separate:
  - `IReadingExamImportService` -> `ReadingExamImportService`
  - `IListeningExamImportService` -> `ListeningExamImportService`
- Listening audio is uploaded directly to R2 using a presigned PUT URL.
- Backend stores the resulting audio URL in `Exam.AudioUrl` / `ExamSection.AudioUrl`.

## 13. Storage Rules

Supabase Storage is for:
- static files
- images
- small assets
- reading/listening resources if appropriate

Cloudflare R2 is for:
- Speaking audio
- Listening audio

Rules:
- Listening audio is uploaded directly to R2 through a presigned PUT URL.
- Speaking audio currently uses the authenticated backend proxy endpoint `POST /api/speaking-practice/{examId:int}/upload`; storage access remains encapsulated behind `IR2StorageService`.
- Do not add another upload path for the same workflow. FE must reuse the returned `AudioObjectKey`/URL when retrying submission or grading.
- R2 CORS must allow the frontend origin and PUT method.

## 14. AI Grading and Speech-to-Text Rules

Writing and Speaking grading use `IAIGradingService`, which selects the configured `IAIProvider`. Speaking audio is transcribed through `ISpeechToTextService` before text grading.

Configuration:

```env
AI_PRIMARY_PROVIDER=GEMINI
AI_FALLBACK_PROVIDER=OPENROUTER
STT_PRIMARY_PROVIDER=DEEPGRAM
SPEAKING_USE_STT=true
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=
OPENROUTER_APP_NAME=VAIApplication
OPENROUTER_MAX_AUDIO_BYTES=15728640
DEEPGRAM_API_KEY=
DEEPGRAM_MODEL=nova-3
DEEPGRAM_BASE_URL=https://api.deepgram.com
```

Rules:
- New grading flows use `IAIGradingService`; provider-specific HTTP belongs in `IAIProvider` implementations.
- Speaking transcription uses `ISpeechToTextService`; provider-specific STT HTTP belongs in the STT implementation.
- `IOpenRouterGradingService` is legacy compatibility code and must not be used for new grading flows.
- Use `HttpClient`.
- Do not call AI or STT providers from controllers.
- Do not hardcode API keys.
- Output must be valid JSON and parsed server-side.
- Store final score in `Score`.
- Store concise feedback in `Feedback`.
- Set submission status:
  - `processing`
  - `scored`
  - `failed`

Writing:
- Send prompt and essay text only.
- Keep prompts cost-conscious.
- Prefer rubric JSON output.

Speaking:
- Persist one final compressed audio object per Speaking part/submission.
- Download the stored object through `IR2StorageService`, transcribe it, then send only the transcript and prompt to the grading provider.
- Make at most one grading call per persisted Speaking submission, excluding the documented JSON-repair retry/fallback path.
- Retry grading with the existing audio object; do not upload the same recording again.

## 15. Personal Dictionary Rules

APIs:

```txt
POST /api/dictionary/search
GET  /api/dictionary/my-words
PUT  /api/dictionary/note
PUT  /api/dictionary/favorite
```

Flow:

```txt
user searches word
-> check DictionaryEntries cache
-> if cache miss: call dictionaryapi.dev and MyMemory
-> save DictionaryEntries
-> save UserVocabulary
-> return DTO
```

Rules:
- `DictionaryEntries.Word` has unique index.
- `UserVocabulary` has unique composite index `(UserId, DictionaryEntryId)`.
- Use PostgreSQL as cache.
- Use `AsNoTracking()` and projection for read-only list queries.
- Do not call dictionary/translation APIs if cache hit.

Config:

```env
MYMEMORY_EMAIL=
```

## 16. payOS Payment Rules

APIs:

```txt
POST /api/payments/payos/subscription
POST /api/payments/payos/webhook
```

Config:

```env
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_RETURN_URL=
PAYOS_CANCEL_URL=
PAYOS_BASE_URL=https://api-merchant.payos.vn/
```

Rules:
- User chooses only `SubscriptionPlanId`.
- Backend loads plan and price from DB.
- Do not trust amount from frontend.
- Webhook must verify HMAC signature with checksum key.
- Webhook must check:
  - transaction exists
  - provider is `payos`
  - amount matches transaction
  - description matches transaction
  - transaction not already `paid`
- On success update:
  - `PaymentTransaction.Status = "paid"`
  - `PaymentTransaction.PaidAt`
  - `PaymentTransaction.RawWebhookPayload`
  - `User.SubscriptionPlanId`
  - `User.SubscriptionExpiresAt`
- Use UnitOfWork transaction.

## 17. Environment Variable Rules

Never hardcode secrets.

Local secrets go in `.env`, not in source control.

Production secrets must come from environment variables or Docker secrets.

All structured config must use `IOptions<T>`.

Add new env mappings in:

```txt
VAIApplication/Extensions/EnvironmentConfigurationExtensions.cs
```

Register settings in:

```txt
VAIApplication/Extensions/ServiceCollectionExtensions.cs
```

Update `.env.example` whenever adding new configuration keys.

## 18. DateTime Rules

Store all database timestamps in UTC.

Forbidden:

```csharp
DateTime.Now
```

Required:

```csharp
DateTime.UtcNow
```

Use UTC for:
- `CreatedAt`
- `UpdatedAt`
- OTP expiry
- refresh token expiry
- payment time
- submission time
- subscription expiry
- cleanup/retention time

Only convert to Vietnam time in frontend or presentation layer.

## 19. Migration Rules

Use EF Core migrations.

Commands:

```bash
dotnet ef migrations add <MigrationName> -p DataAccessLayer -s VAIApplication
dotnet ef database update -p DataAccessLayer -s VAIApplication
dotnet ef migrations has-pending-model-changes -p DataAccessLayer -s VAIApplication
```

Do not fake migration success.

If build output is locked by a running backend process, either stop the backend or build to a temp output for compile checks. Do not leave temp folders committed.

Seed data must use fixed deterministic `DateTime`, not `DateTime.UtcNow`.

## 20. Performance and Cost Rules

Always prefer:
- fewer DB queries
- projected columns
- pagination
- `AsNoTracking()` for reads
- cache hits over external calls
- one AI call per final Writing/Speaking submission, excluding provider fallback/JSON-repair retry
- direct-to-storage upload for large files

Avoid:
- loading huge graphs with `Include`
- returning unnecessary fields
- calling AI repeatedly for small subparts
- loading broad result sets with an oversized page and filtering them in BLL

## 21. Swagger Rules

Every endpoint should have:
- Vietnamese or clear English XML summary
- `ProducesResponseType`
- proper auth attributes
- `ApiResponse<T>`

Swagger XML comments must stay enabled in `VAIApplication.csproj`.

## 22. Naming Rules

Use existing naming style:

```txt
IAuthService / AuthService
IUserRepository / UserRepository
CreateUserRequest
UserResponse
PaymentTransactionRepository
```

Request DTOs end with `Request`.
Response DTOs end with `Response`.
Interfaces start with `I`.

## 23. What Not To Do

Do not:
- introduce Clean Architecture or Domain Layer
- call DbContext from controllers
- return entities directly from APIs
- expose IQueryable from repositories
- store secrets in code
- use Guid/UUID keys
- use `DateTime.Now`
- trust payment amount from client
- trust webhook without signature verification
- create duplicate R2 objects when retrying the same Speaking submission
- call AI or STT providers from controllers
- change AI/payment/storage providers without updating configuration mappings, `.env.example`, DI registration, and this guide

## 24. Verification Checklist

Before handoff after backend changes:

```bash
dotnet restore
dotnet build
dotnet ef migrations has-pending-model-changes -p DataAccessLayer -s VAIApplication
```

If schema changed:

```bash
dotnet ef migrations add <Name> -p DataAccessLayer -s VAIApplication
dotnet ef database update -p DataAccessLayer -s VAIApplication
```

Also verify:
- endpoints compile and Swagger loads
- no pending EF model changes
- no secrets added to git
- routes use int IDs
- controllers stay thin
- DTOs are used for all API responses
- no plaintext OTP appears in logs or source logging statements
- BLL services access persistence only through repositories/`IUnitOfWork`
