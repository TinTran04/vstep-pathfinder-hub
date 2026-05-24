# VSTEPPro Backend — ASP.NET Core 8 Web API

Hệ thống API backend cho ứng dụng luyện thi VSTEPPro được phát triển dựa trên nền tảng **.NET Core 8 Web API** và cấu trúc dự án theo mô hình 3 lớp chuẩn mực nhằm tối ưu khả năng mở rộng, bảo mật và hiệu năng.

---

## 🏗️ Kiến Trúc Hệ Thống (3-Layer Architecture)

* **VAIApplication (Presentation Layer)**:
  - Nơi tiếp nhận các request HTTP từ phía Frontend.
  - Chứa các Controllers (`AuthController.cs`, `UserController.cs`, v.v.).
  - Middlewares quản lý exception toàn cục (`GlobalExceptionMiddleware.cs`).
* **BusinessLogicLayer (BLL)**:
  - Xử lý các logic nghiệp vụ lõi (Business Logic) của hệ thống.
  - Chứa định nghĩa các interfaces và services thực thi (`AuthService.cs`, `UserService.cs`).
  - Chứa các DTOs (Data Transfer Objects) phục vụ đóng gói và truyền tải dữ liệu.
  - Tích hợp dịch vụ gửi Mail SMTP (`EmailService.cs`).
* **DataAccessLayer (DAL)**:
  - Quản lý giao tiếp trực tiếp với Cơ sở dữ liệu.
  - Định nghĩa các Entities (User, Role, Exam, v.v.).
  - Áp dụng mẫu thiết kế Repository và Unit of Work để trừu tượng hóa các truy vấn thông qua EF Core.

---

## 🔑 Các Tính Năng Auth & OTP Vừa Cập Nhật
Hệ thống vừa nâng cấp luồng xác thực nâng cao bao gồm:
1. **Đổi Mật Khẩu (`POST /auth/change-password`)**: Yêu cầu Token đăng nhập, xác thực bằng mật khẩu hiện tại thông qua thư viện băm mật khẩu BCrypt trước khi đổi mật khẩu mới.
2. **Quên Mật Khẩu (`POST /auth/forgot-password`)**: Sinh mã OTP ngẫu nhiên 6 chữ số, lưu trữ hash của OTP trong database, thiết lập thời gian hết hạn (5 phút), và gửi email OTP đến người dùng thông qua background task để giải phóng luồng HTTP.
3. **Xác Thực OTP (`POST /auth/verify-reset-otp`)**: Kiểm tra mã OTP người dùng nhập từ email xem có đúng và còn hiệu lực hay không.
4. **Reset Mật Khẩu Mới (`POST /auth/reset-password`)**: Xác thực OTP lần cuối và tiến hành ghi đè mật khẩu băm mới cho tài khoản.

*Chi tiết về đặc tả API này và các API cần xây dựng tiếp theo, vui lòng xem tại **[Báo Cáo Hệ Thống & Đặc Tả API VSTEPPro](../FE_DOCUMENTATION.md)** và nhật ký **[Nhật Ký Thay Đổi Backend (24/05/2026)](CHANGES_2026_05_24.md)**.*

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Yêu cầu hệ thống
- .NET 8 SDK
- SQL Server hoặc PostgreSQL (Tùy thuộc vào cấu hình file ConnectionString trong `appsettings.json`)

### 2. Khởi chạy
Chạy lệnh trực tiếp thông qua CLI tại thư mục `VAIApplication`:
```bash
cd VAIApplication
dotnet run
```
API Swagger sẽ hiển thị tại địa chỉ: `http://localhost:5000/swagger/index.html` hoặc cổng HTTPS tương ứng.