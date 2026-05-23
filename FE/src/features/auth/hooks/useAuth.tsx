// src/features/auth/hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "../services/auth.service";

export interface UserData {
  name: string;
  email: string;
  avatar: string;
  plan: string;
  points: number;
  streak: number;
  role: "student" | "admin";
}

interface AuthContextType {
  isLoggedIn: boolean;
  isInitialising: boolean;
  user: UserData | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserData>) => void;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; needsOtp?: boolean; error?: string }>;
  verifyOtp: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isInitialising: true,
  user: null,
  login: () => Promise.resolve({ success: false }),
  logout: () => Promise.resolve(),
  updateUser: () => {},
  register: () => Promise.resolve({ success: false }),
  verifyOtp: () => Promise.resolve({ success: false }),
  resendOtp: () => Promise.resolve({ success: false }),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialising, setIsInitialising] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
    const savedUser = authService.restoreSession();
    if (savedUser) {
      setUser(savedUser);
      setIsLoggedIn(true);
      // Silently refresh access token in background
      authService.refreshToken().then((ok) => {
        if (!ok) {
          setIsLoggedIn(false);
          setUser(null);
        }
      });
    }
    setIsInitialising(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setIsLoggedIn(true);
      setUser(result.user);
      return { success: true, role: result.user.role };
    }
    return { success: false, error: result.error };
  };

  // ── Register (step 1 — sends OTP, not logged in) ──────────────
  const register = async (name: string, email: string, password: string) => {
    const result = await authService.register({ name, email, password });
    return result;
  };

  // ── Verify OTP (step 2 — completes registration, logs in) ─────
  const verifyOtp = async (email: string, otp: string) => {
    const result = await authService.verifyOtp(email, otp);
    if (result.success && result.user) {
      setIsLoggedIn(true);
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const resendOtp = async (email: string) => {
    return authService.resendOtp(email);
  };

  // ── Logout ────────────────────────────────────────────────────
  const logout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  const updateUser = (data: Partial<UserData>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isInitialising,
        user,
        login,
        logout,
        updateUser,
        register,
        verifyOtp,
        resendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
