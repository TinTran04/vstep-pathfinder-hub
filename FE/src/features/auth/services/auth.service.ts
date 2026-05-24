// src/features/auth/services/auth.service.ts
// ============================================================
// Auth Service — gọi API thật tới VAIApplication BE.
//
// Endpoints (base: /api/auth):
//   POST /login          → { email, password }
//   POST /register       → { fullName, email, password }
//   POST /verify-otp     → { email, otp }
//   POST /resend-otp     → { email }
//   POST /refresh-token  → { refreshToken }
//   POST /logout         → { refreshToken }
//
// Token storage:
//   Access token  → apiClient.authToken (in-memory)
//   Refresh token → localStorage "vstep_refresh_token"
//   User info     → localStorage "vstep_user"
// ============================================================

import { apiClient } from "@/services/api-client";
import type { UserData } from "@/features/auth/hooks/useAuth";

// ----------------------------------------------------------------
// Keys
// ----------------------------------------------------------------
const REFRESH_KEY = "vstep_refresh_token";
const USER_KEY = "vstep_user";

// ----------------------------------------------------------------
// BE response shape (mirrors AuthResponse.cs)
// ----------------------------------------------------------------
interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  subscriptionPlan: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

/** Map BE AuthResponse → FE UserData */
function toUserData(res: AuthResponse): UserData {
  return {
    name: res.fullName,
    email: res.email,
    avatar: "",
    plan: res.subscriptionPlan || "Miễn phí",
    points: 0,
    streak: 0,
    role: res.role?.toLowerCase() === "admin" ? "admin" : "student",
  };
}

/** Persist tokens + user after successful auth */
function persistSession(res: AuthResponse): UserData {
  apiClient.authToken = res.accessToken;
  localStorage.setItem(REFRESH_KEY, res.refreshToken);
  const user = toUserData(res);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

/** Clear all session data */
function clearSession() {
  apiClient.authToken = null;
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

// ----------------------------------------------------------------
// Public service
// ----------------------------------------------------------------

export const authService = {
  // ── Login ──────────────────────────────────────────────────────
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      const res = await apiClient.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      const user = persistSession(res);
      return { success: true, user };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      return {
        success: false,
        error: msg || "Email hoặc mật khẩu không đúng",
      };
    }
  },

  // ── Register (sends OTP — NOT logged in yet) ───────────────────
  async register(payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; needsOtp?: boolean; error?: string }> {
    try {
      // BE returns AuthResponse but WITHOUT valid tokens until OTP verified.
      await apiClient.post<AuthResponse>("/auth/register", {
        fullName: payload.name,
        email: payload.email,
        password: payload.password,
      });
      // Don't persist — OTP not yet verified.
      return { success: true, needsOtp: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      return { success: false, error: msg || "Đăng ký thất bại" };
    }
  },

  // ── Verify OTP (after register) ────────────────────────────────
  async verifyOtp(
    email: string,
    otp: string
  ): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      const res = await apiClient.post<AuthResponse>("/auth/verify-otp", {
        email,
        otp,
      });
      const user = persistSession(res);
      return { success: true, user };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      return { success: false, error: msg || "Mã OTP không hợp lệ" };
    }
  },

  // ── Resend OTP ─────────────────────────────────────────────────
  async resendOtp(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/resend-otp", { email });
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      return { success: false, error: msg || "Không thể gửi lại OTP" };
    }
  },

  // ── Logout ─────────────────────────────────────────────────────
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    try {
      if (refreshToken) {
        await apiClient.post<unknown>("/auth/logout", { refreshToken });
      }
    } catch {
      // Ignore logout errors — always clear local session
    } finally {
      clearSession();
    }
  },

  // ── Refresh access token ────────────────────────────────────────
  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;
    try {
      const res = await apiClient.post<AuthResponse>("/auth/refresh-token", {
        refreshToken,
      });
      persistSession(res);
      return true;
    } catch {
      clearSession();
      return false;
    }
  },

  // ── Change Password ─────────────────────────────────────────────
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      return {
        success: false,
        error: msg || "Đổi mật khẩu thất bại",
      };
    }
  },

  // ── Forgot Password ─────────────────────────────────────────────
  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/forgot-password", { email });
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      return {
        success: false,
        error: msg || "Gửi yêu cầu thất bại",
      };
    }
  },

  // ── Verify Reset Password OTP ───────────────────────────────────
  async verifyResetOtp(
    email: string,
    otp: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/verify-reset-otp", { email, otp });
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      return {
        success: false,
        error: msg || "Mã OTP không hợp lệ hoặc đã hết hạn",
      };
    }
  },

  // ── Reset Password ──────────────────────────────────────────────
  async resetPassword(payload: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/reset-password", payload);
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      return {
        success: false,
        error: msg || "Đặt lại mật khẩu thất bại",
      };
    }
  },

  // ── Restore session on page load ────────────────────────────────
  restoreSession(): UserData | null {
    const raw = localStorage.getItem(USER_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!raw || !refreshToken) return null;
    try {
      // authToken is null after page reload — silently refresh in background.
      return JSON.parse(raw) as UserData;
    } catch {
      return null;
    }
  },
};

export default authService;
