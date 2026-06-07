import { DEFAULT_AVATAR_KEY, normalizeAvatarKey } from "@/features/auth/avatarCatalog";
import type { UserData } from "@/features/auth/hooks/useAuth";
import { apiClient } from "@/services/api-client";

const ACCESS_KEY = "vstep_access_token";
const REFRESH_KEY = "vstep_refresh_token";
const USER_KEY = "vstep_user";

interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  avatarKey?: string;
  role: string;
  subscriptionPlan: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

interface UserResponse {
  fullName: string;
  email: string;
  avatarKey?: string;
  role: string;
  subscriptionPlan: string;
}

function toUserData(res: AuthResponse): UserData {
  return {
    name: res.fullName,
    email: res.email,
    avatarKey: normalizeAvatarKey(res.avatarKey || DEFAULT_AVATAR_KEY),
    plan: res.subscriptionPlan || "Miễn phí",
    points: 0,
    streak: 0,
    role: res.role?.toLowerCase() === "admin" ? "admin" : "student",
  };
}

function userResponseToUserData(res: UserResponse, current?: UserData | null): UserData {
  return {
    name: res.fullName,
    email: res.email,
    avatarKey: normalizeAvatarKey(res.avatarKey || DEFAULT_AVATAR_KEY),
    plan: res.subscriptionPlan || current?.plan || "Miễn phí",
    points: current?.points || 0,
    streak: current?.streak || 0,
    role: res.role?.toLowerCase() === "admin" ? "admin" : "student",
  };
}

function persistSession(res: AuthResponse): UserData {
  apiClient.authToken = res.accessToken;
  localStorage.setItem(ACCESS_KEY, res.accessToken);
  localStorage.setItem(REFRESH_KEY, res.refreshToken);
  const user = toUserData(res);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

function clearSession() {
  apiClient.authToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function getErrorMessage(err: unknown): string | undefined {
  return (err as { message?: string })?.message;
}

export const authService = {
  async login(email: string, password: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.log("[FE-PERF] authService.login start");
      console.time("LOGIN_TOTAL_FE");
      console.time("AUTH_LOGIN_REQUEST");
      console.log("[FE-PERF] request sent");
    }

    try {
      const res = await apiClient.post<AuthResponse>("/auth/login", { email, password });
      if (isDev) {
        console.timeEnd("AUTH_LOGIN_REQUEST");
        console.log("[FE-PERF] response received");
      }
      const user = persistSession(res);
      if (isDev) {
        console.log("[FE-PERF] token saved");
      }
      return { success: true, user };
    } catch (err: unknown) {
      if (isDev) {
        console.timeEnd("AUTH_LOGIN_REQUEST");
        console.timeEnd("LOGIN_TOTAL_FE");
      }
      return { success: false, error: getErrorMessage(err) || "Email hoặc mật khẩu không đúng" };
    }
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; needsOtp?: boolean; error?: string }> {
    try {
      await apiClient.post<AuthResponse>("/auth/register", {
        fullName: payload.name,
        email: payload.email,
        password: payload.password,
      });
      return { success: true, needsOtp: true };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) || "Đăng ký thất bại" };
    }
  },

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      const res = await apiClient.post<AuthResponse>("/auth/verify-otp", { email, otp });
      const user = persistSession(res);
      return { success: true, user };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) || "Mã OTP không hợp lệ" };
    }
  },

  async resendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/resend-otp", { email });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) || "Không thể gửi lại OTP" };
    }
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    try {
      if (refreshToken) {
        await apiClient.post<unknown>("/auth/logout", { refreshToken });
      }
    } finally {
      clearSession();
    }
  },

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;

    try {
      const res = await apiClient.post<AuthResponse>("/auth/refresh-token", { refreshToken });
      persistSession(res);
      return true;
    } catch {
      clearSession();
      return false;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/change-password", { currentPassword, newPassword });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) || "Đổi mật khẩu thất bại" };
    }
  },

  async updateMyProfile(payload: {
    name: string;
    avatarKey: string;
  }): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      const current = this.restoreSession();
      const res = await apiClient.patch<UserResponse>("/Users/me", {
        fullName: payload.name,
        avatarKey: payload.avatarKey,
      });
      const user = userResponseToUserData(res, current);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { success: true, user };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) || "Cập nhật hồ sơ thất bại" };
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/forgot-password", { email });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) || "Gửi yêu cầu thất bại" };
    }
  },

  async verifyResetOtp(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/verify-reset-otp", { email, otp });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) || "Mã OTP không hợp lệ hoặc đã hết hạn" };
    }
  },

  async resetPassword(payload: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post<unknown>("/auth/reset-password", payload);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) || "Đặt lại mật khẩu thất bại" };
    }
  },

  restoreSession(): UserData | null {
    const raw = localStorage.getItem(USER_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const accessToken = localStorage.getItem(ACCESS_KEY);
    if (!raw || !refreshToken) return null;

    try {
      if (accessToken) {
        apiClient.authToken = accessToken;
      }
      const parsed = JSON.parse(raw) as UserData & { avatar?: string };
      const user: UserData = {
        ...parsed,
        avatarKey: normalizeAvatarKey(parsed.avatarKey || DEFAULT_AVATAR_KEY),
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  },
};

export default authService;
