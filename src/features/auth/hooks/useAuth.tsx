import { createContext, useContext, useState, ReactNode } from "react";
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
  user: UserData | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserData>) => void;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: () => Promise.resolve({ success: false }),
  logout: () => Promise.resolve(),
  updateUser: () => {},
  register: () => Promise.resolve({ success: false }),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setIsLoggedIn(true);
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await authService.register({ name, email, password });
    if (result.success && result.user) {
      setIsLoggedIn(true);
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  const updateUser = (data: Partial<UserData>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, updateUser, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
