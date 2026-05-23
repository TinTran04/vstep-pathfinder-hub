import { Award, TrendingUp, Star } from "lucide-react";

export type Skill = "listening" | "reading" | "writing" | "speaking";

export interface QuizItem {
  id: number;
  title: string;
  description: string;
  duration: string;
  questions: number;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  isFree: boolean;
}

export const skills = [
  { key: "listening" as Skill, label: "Listening", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", desc: "Nghe hiểu hội thoại, bài giảng và thông báo" },
  { key: "reading" as Skill, label: "Reading", color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", desc: "Đọc hiểu đoạn văn, bài báo và tài liệu" },
  { key: "writing" as Skill, label: "Writing", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", desc: "Viết email, thư và bài luận" },
  { key: "speaking" as Skill, label: "Speaking", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200", desc: "Phỏng vấn, thảo luận và trình bày" },
];

export const quizzes: Record<Skill, QuizItem[]> = {
  listening: [
    { id: 1, title: "Đề thi thử Listening #1", description: "Nghe hiểu hội thoại ngắn và trả lời câu hỏi", duration: "30 phút", questions: 25, difficulty: "Dễ", isFree: true },
    { id: 2, title: "Đề thi thử Listening #2", description: "Nghe hiểu bài giảng và ghi chú thông tin", duration: "35 phút", questions: 30, difficulty: "Trung bình", isFree: true },
    { id: 3, title: "Đề thi thử Listening #3", description: "Nghe hiểu thông báo và hội thoại phức tạp", duration: "40 phút", questions: 35, difficulty: "Khó", isFree: false },
  ],
  reading: [
    { id: 6, title: "Đề thi thử Reading #1", description: "Đọc hiểu đoạn văn ngắn và xác định ý chính", duration: "45 phút", questions: 30, difficulty: "Dễ", isFree: true },
    { id: 7, title: "Đề thi thử Reading #2", description: "Đọc hiểu bài báo khoa học và phân tích", duration: "50 phút", questions: 35, difficulty: "Trung bình", isFree: true },
    { id: 8, title: "Đề thi thử Reading #3", description: "Đọc hiểu tài liệu học thuật nâng cao", duration: "55 phút", questions: 40, difficulty: "Khó", isFree: false },
  ],
  writing: [
    { id: 10, title: "Đề thi thử Writing #1", description: "Viết email + bài luận theo tình huống thực tế", duration: "60 phút", questions: 2, difficulty: "Dễ", isFree: true },
    { id: 11, title: "Đề thi thử Writing #2", description: "Viết thư trang trọng + bài luận nghị luận", duration: "60 phút", questions: 2, difficulty: "Trung bình", isFree: true },
    { id: 12, title: "Đề thi thử Writing #3", description: "Đề thi chuẩn VSTEP đầy đủ Task 1 & Task 2", duration: "60 phút", questions: 2, difficulty: "Khó", isFree: false },
  ],
  speaking: [
    { id: 13, title: "Đề thi thử Speaking #1", description: "Phỏng vấn cá nhân + trình bày chủ đề", duration: "12 phút", questions: 3, difficulty: "Dễ", isFree: true },
    { id: 14, title: "Đề thi thử Speaking #2", description: "Phỏng vấn + thảo luận chuyên sâu", duration: "12 phút", questions: 3, difficulty: "Trung bình", isFree: true },
    { id: 15, title: "Đề thi thử Speaking #3", description: "Format chuẩn VSTEP đầy đủ 3 phần", duration: "15 phút", questions: 3, difficulty: "Khó", isFree: false },
  ],
};

export const overviewData: Record<Skill, { structure: { part: string; content: string; questions: string; time: string }[]; tips: string[]; scoring: string }> = {
  listening: {
    structure: [
      { part: "Part 1", content: "Short Announcements / Instructions", questions: "8 câu", time: "~10 phút" },
      { part: "Part 2", content: "Conversations (3 đoạn hội thoại)", questions: "12 câu", time: "~15 phút" },
      { part: "Part 3", content: "Talks / Lectures (3 bài nói)", questions: "15 câu", time: "~15 phút" },
    ],
    tips: ["Đọc câu hỏi trước khi nghe", "Ghi chú từ khóa quan trọng", "Chú ý từ đồng nghĩa và paraphrase", "Không dành quá nhiều thời gian cho 1 câu"],
    scoring: "Mỗi câu 0.286 điểm. Tổng 35 câu = 10 điểm.",
  },
  reading: {
    structure: [
      { part: "Passage 1", content: "Đoạn văn ngắn, chủ đề đời thường", questions: "10 câu", time: "~12 phút" },
      { part: "Passage 2", content: "Bài báo khoa học phổ thông", questions: "10 câu", time: "~15 phút" },
      { part: "Passage 3", content: "Văn bản học thuật chuyên sâu", questions: "10 câu", time: "~15 phút" },
      { part: "Passage 4", content: "Tài liệu nghiên cứu nâng cao", questions: "10 câu", time: "~18 phút" },
    ],
    tips: ["Skimming để nắm ý chính trước", "Scanning để tìm thông tin cụ thể", "Chú ý từ nối và cấu trúc đoạn văn", "Quản lý thời gian: ~15 phút/passage"],
    scoring: "Mỗi câu 0.25 điểm. Tổng 40 câu = 10 điểm.",
  },
  writing: {
    structure: [
      { part: "Task 1", content: "Viết thư/email (formal hoặc informal)", questions: "1 bài", time: "20 phút" },
      { part: "Task 2", content: "Viết bài luận nghị luận (250+ từ)", questions: "1 bài", time: "40 phút" },
    ],
    tips: ["Task 1: Đảm bảo đủ 3 ý trong đề", "Task 2: Có mở bài, thân bài (2 đoạn), kết luận", "Sử dụng từ nối và collocations", "Kiểm tra lỗi ngữ pháp trước khi nộp"],
    scoring: "Task 1: 1/3 tổng điểm (~3.3/10). Task 2: 2/3 tổng điểm (~6.7/10). Chấm theo 4 tiêu chí: Task Achievement, Coherence, Lexical, Grammar.",
  },
  speaking: {
    structure: [
      { part: "Part 1", content: "Phỏng vấn cá nhân (Social Interaction)", questions: "~8 câu", time: "3 phút" },
      { part: "Part 2", content: "Trình bày chủ đề (Individual Long Turn)", questions: "1 chủ đề", time: "4 phút" },
      { part: "Part 3", content: "Thảo luận chuyên sâu (Topic Development)", questions: "~5 câu", time: "5 phút" },
    ],
    tips: ["Part 1: Trả lời tự nhiên, đầy đủ", "Part 2: Chuẩn bị 1 phút, nói 1-2 phút", "Part 3: Đưa ra ý kiến và giải thích", "Chú ý phát âm và ngữ điệu"],
    scoring: "Chấm theo 4 tiêu chí: Pronunciation, Fluency, Vocabulary, Grammar. Mỗi tiêu chí 2.5 điểm.",
  },
};

export const topStudents = [
  { name: "Nguyễn Minh Anh", avatar: "MA", score: "8.5", level: "C1", role: "Sinh viên năm cuối – ĐH Ngoại thương", improvement: "+2.5 bậc sau 3 tháng" },
  { name: "Trần Văn Hùng", avatar: "VH", score: "7.0", level: "B2", role: "Nhân viên văn phòng", improvement: "+2.0 bậc sau 4 tháng" },
  { name: "Lê Thị Hương", avatar: "TH", score: "7.5", level: "B2", role: "Sinh viên năm 4 – ĐH Sư phạm", improvement: "+1.5 bậc sau 2 tháng" },
  { name: "Phạm Đức Minh", avatar: "ĐM", score: "9.0", level: "C1", role: "Giảng viên tiếng Anh", improvement: "+1.0 bậc sau 2 tháng" },
  { name: "Hoàng Thị Lan", avatar: "TL", score: "6.5", level: "B1", role: "Sinh viên năm cuối – ĐH Bách khoa", improvement: "+2.0 bậc sau 3 tháng" },
  { name: "Đỗ Quang Khải", avatar: "QK", score: "8.0", level: "B2", role: "Kỹ sư phần mềm", improvement: "+1.5 bậc sau 3 tháng" },
];

export const testimonials = [
  {
    name: "Nguyễn Minh Anh",
    avatar: "MA",
    role: "Sinh viên năm cuối – ĐH Ngoại thương",
    content: "Nhờ VSTEPPro mà mình đạt C1 ngay lần thi đầu tiên. Hệ thống luyện đề mô phỏng rất sát thực tế, đặc biệt phần Listening và Reading. Mình rất recommend cho bạn nào cần chuẩn đầu ra!",
    rating: 5,
    result: "C1 – 8.5 điểm",
  },
  {
    name: "Trần Văn Hùng",
    avatar: "VH",
    role: "Nhân viên văn phòng",
    content: "Ban đầu mình chỉ ở mức A2, sau 4 tháng học trên VSTEPPro mình đã đạt B2. Lộ trình học rõ ràng, theo dõi tiến độ dễ dàng. Rất phù hợp cho người đi làm bận rộn.",
    rating: 5,
    result: "B2 – 7.0 điểm",
  },
  {
    name: "Lê Thị Hương",
    avatar: "TH",
    role: "Sinh viên năm 4 – ĐH Sư phạm",
    content: "Phần Writing và Speaking trên VSTEPPro giúp mình cải thiện rất nhiều. Đề thi mô phỏng giống y như thi thật, mình tự tin hơn rất nhiều khi vào phòng thi.",
    rating: 4,
    result: "B2 – 7.5 điểm",
  },
];

export const stats = [
  { label: "Học viên đạt B2+", value: "85%", icon: Award },
  { label: "Điểm trung bình cải thiện", value: "+2.0", icon: TrendingUp },
  { label: "Tỷ lệ hài lòng", value: "96%", icon: Star },
];

export const skillStats = [
  { skill: "Listening", avg: 7.2, max: 9.5 },
  { skill: "Reading", avg: 7.0, max: 9.0 },
  { skill: "Writing", avg: 6.5, max: 8.5 },
  { skill: "Speaking", avg: 6.8, max: 9.0 },
];
