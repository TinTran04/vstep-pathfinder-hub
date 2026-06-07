import { UserData } from "../hooks/useAuth";

export const seededAccounts: { email: string; password: string; user: UserData }[] = [
  {
    email: "admin@vsteppro.vn",
    password: "admin123",
    user: {
      name: "Admin VSTEPPro",
      email: "admin@vsteppro.vn",
      avatarKey: "avatar1",
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
      avatarKey: "avatar1",
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
      avatarKey: "avatar1",
      plan: "Miễn phí",
      points: 45,
      streak: 3,
      role: "student",
    },
  },
];
