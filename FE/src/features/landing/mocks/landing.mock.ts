import { Target, Layers, Route, BarChart3 } from "lucide-react";

export const benefits = [
  {
    icon: Target,
    title: "Đúng cấu trúc đề VSTEP",
    desc: "Bài học và đề thi được thiết kế sát format VSTEP chính thức, giúp bạn quen dạng đề ngay từ đầu.",
  },
  {
    icon: Layers,
    title: "Luyện 4 kỹ năng đầy đủ",
    desc: "Listening, Reading, Writing, Speaking — luyện toàn diện với bài tập thực tế cho từng kỹ năng.",
  },
  {
    icon: Route,
    title: "Lộ trình tự học rõ ràng",
    desc: "Học theo lộ trình được thiết kế khoa học, phù hợp với trình độ và mục tiêu của bạn.",
  },
  {
    icon: BarChart3,
    title: "Theo dõi tiến độ dễ dàng",
    desc: "Dashboard trực quan giúp bạn nắm rõ điểm mạnh, điểm yếu và tiến bộ sau mỗi bài học.",
  },
];

export const testimonials = [
  {
    name: "Nguyễn Minh Anh",
    role: "Sinh viên năm cuối — ĐH Bách Khoa",
    content: "Mình đã đạt B2 VSTEP sau 2 tháng luyện trên VSTEPPro. Lộ trình rõ ràng, đề thi sát thực tế, dashboard giúp mình biết điểm yếu để cải thiện.",
    rating: 5,
  },
  {
    name: "Trần Văn Hùng",
    role: "Nhân viên văn phòng",
    content: "Là người đi làm, mình không có nhiều thời gian nhưng với lộ trình tự học của VSTEPPro, mình vẫn ôn được đều đặn mỗi ngày và đã thi đỗ B1.",
    rating: 5,
  },
  {
    name: "Phạm Thị Hương",
    role: "Sinh viên năm cuối — ĐH Sư Phạm",
    content: "Tính năng luyện đề có tính giờ giúp mình quản lý thời gian tốt hơn rất nhiều. Điểm Reading và Listening tăng rõ rệt chỉ sau 3 tuần.",
    rating: 5,
  },
];

export const plans = [
  {
    name: "Miễn phí",
    price: "0đ",
    rawPrice: 0,
    period: "Mãi mãi",
    popular: false,
    features: [
      "Truy cập 10 bài học cơ bản",
      "1 đề thi thử miễn phí",
      "Xem lộ trình học tổng quan",
      "Hỗ trợ cộng đồng",
    ],
  },
  {
    name: "Gói Tháng",
    price: "199.000đ",
    rawPrice: 199000,
    period: "/tháng",
    popular: true,
    features: [
      "Chấm điểm AI không giới hạn",
      "Lộ trình học cá nhân hoá",
      "Toàn bộ bài học 4 kỹ năng",
      "Truy cập đầy đủ ngân hàng đề",
      "Dashboard theo dõi tiến độ",
      "Feedback Speaking & Writing từ AI",
    ],
  },
  {
    name: "Gói Tuần",
    price: "49.000đ",
    rawPrice: 49000,
    period: "/tuần",
    popular: false,
    features: [
      "Dành cho ôn thi ngắn hạn",
      "Chấm điểm AI không giới hạn",
      "Truy cập đầy đủ ngân hàng đề",
      "Lộ trình học cá nhân hoá",
      "Phù hợp ôn nước rút trước kỳ thi",
    ],
  },
];
