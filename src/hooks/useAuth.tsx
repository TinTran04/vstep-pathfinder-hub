import { createContext, useContext, useState, ReactNode } from "react";

interface UserData {
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
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (data: Partial<UserData>) => void;
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: () => ({ success: false }),
  logout: () => {},
  updateUser: () => {},
  register: () => ({ success: false }),
});

// Seeded accounts
const seededAccounts: { email: string; password: string; user: UserData }[] = [
  {
    email: "admin@vsteppro.vn",
    password: "admin123",
    user: {
      name: "Admin VSTEPPro",
      email: "admin@vsteppro.vn",
      avatar: "",
      plan: "Admin",
      points: 0,
      streak: 0,
      role: "admin",
    },
  },
  {
    email: "user@vsteppro.vn",
    password: "user123",
    user: {
      name: "Nguyễn Văn A",
      email: "user@vsteppro.vn",
      avatar: "",
      plan: "Gói Tháng",
      points: 350,
      streak: 12,
      role: "student",
    },
  },
  {
    email: "hocvien@gmail.com",
    password: "123456",
    user: {
      name: "Trần Thị B",
      email: "hocvien@gmail.com",
      avatar: "",
      plan: "Miễn phí",
      points: 45,
      streak: 3,
      role: "student",
    },
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  // Store registered accounts in memory
  const [registeredAccounts, setRegisteredAccounts] = useState<typeof seededAccounts>([]);

  const login = (email: string, password: string) => {
    const allAccounts = [...seededAccounts, ...registeredAccounts];
    const account = allAccounts.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    if (account) {
      setIsLoggedIn(true);
      setUser({ ...account.user });
      return { success: true };
    }
    return { success: false, error: "Email hoặc mật khẩu không đúng" };
  };

  const register = (name: string, email: string, password: string) => {
    const allAccounts = [...seededAccounts, ...registeredAccounts];
    if (allAccounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "Email đã tồn tại" };
    }
    const newUser: UserData = {
      name,
      email,
      avatar: "",
      plan: "Miễn phí",
      points: 0,
      streak: 0,
      role: "student",
    };
    setRegisteredAccounts((prev) => [...prev, { email, password, user: newUser }]);
    setIsLoggedIn(true);
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
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
