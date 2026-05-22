import { seededAccounts } from "../mocks/auth.mock";
import type { UserData } from "../hooks/useAuth";

const registeredAccounts = [...seededAccounts];
let currentUser: UserData | null = null;

export const authService = {
  async login(email: string, password: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const account = registeredAccounts.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    if (account) {
      currentUser = { ...account.user };
      return { success: true, user: currentUser };
    }
    return { success: false, error: "Email hoặc mật khẩu không đúng" };
  },

  async register(payload: { name: string; email: string; password: string }): Promise<{ success: boolean; user?: UserData; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (registeredAccounts.some((a) => a.email.toLowerCase() === payload.email.toLowerCase())) {
      return { success: false, error: "Email đã tồn tại" };
    }
    const newUser: UserData = {
      name: payload.name,
      email: payload.email,
      avatar: "",
      plan: "Miễn phí",
      points: 0,
      streak: 0,
      role: "student",
    };
    registeredAccounts.push({ email: payload.email, password: payload.password, user: newUser });
    currentUser = newUser;
    return { success: true, user: newUser };
  },

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    currentUser = null;
  },

  async getCurrentUser(): Promise<UserData | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return currentUser;
  }
};
export default authService;
