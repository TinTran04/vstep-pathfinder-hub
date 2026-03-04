import { createContext, useContext, useState, ReactNode } from "react";

interface UserData {
  name: string;
  email: string;
  avatar: string;
  plan: string;
  points: number;
  streak: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserData | null;
  login: () => void;
  logout: () => void;
  updateUser: (data: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

const defaultUser: UserData = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  avatar: "",
  plan: "Gói Nâng cao",
  points: 350,
  streak: 12,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const login = () => {
    setIsLoggedIn(true);
    setUser(defaultUser);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  const updateUser = (data: Partial<UserData>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
