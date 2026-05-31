export interface SpeakingPart {
  id: number;
  title: string;
  duration: string;
  prompt: string;
  tips: string[];
}

export interface SpeakingFeedback {
  pronunciation: string;
  fluency: string;
  grammar: string;
  vocabulary: string;
  tips: string[];
}

export const parts: SpeakingPart[] = [
  {
    id: 1,
    title: "Part 1 – Tương tác xã hội",
    duration: "3 phút",
    prompt: "Let's talk about your hometown.\n\n1. Where is your hometown?\n2. What do you like most about living there?\n3. Has your hometown changed much in recent years? How?",
    tips: ["Trả lời tự nhiên, không học thuộc lòng", "Mỗi câu nên trả lời 3-4 câu", "Sử dụng thì phù hợp"],
  },
  {
    id: 2,
    title: "Part 2 – Thảo luận giải pháp",
    duration: "4 phút",
    prompt: "Your university is planning to improve the campus facilities. Here are some suggestions:\n\n• Build a new library\n• Upgrade the sports center\n• Create more green spaces\n\nDiscuss the advantages and disadvantages of each suggestion and decide which improvement would benefit students the most.",
    tips: ["Thảo luận cả ưu và nhược điểm", "Đưa ra lý do cho lựa chọn của bạn", "Sử dụng từ nối logic"],
  },
  {
    id: 3,
    title: "Part 3 – Phát triển chủ đề",
    duration: "5 phút",
    prompt: "Topic: The impact of social media on young people\n\nYou should:\n• Describe how social media affects young people's daily lives\n• Discuss both positive and negative effects\n• Give your opinion on how to use social media responsibly\n• Suggest what parents and schools can do",
    tips: ["Trình bày có cấu trúc: mở bài, thân bài, kết", "Đưa ra ví dụ cụ thể", "Thể hiện quan điểm cá nhân rõ ràng", "Nói ít nhất 2 phút"],
  },
];

export const TOTAL_TIME = 12 * 60;

export const speakingFeedbackAITemplates: Record<number, SpeakingFeedback> = {
  1: {
    pronunciation: "7.5/10 – Phát âm khá rõ ràng, cần chú ý âm cuối /s/, /z/, /t/, /d/. Một số từ cần cải thiện: 'environment' (/ɪnˈvaɪrənmənt/), 'specifically' (/spəˈsɪfɪkli/).",
    fluency: "7.0/10 – Nói khá trôi chảy nhưng còn nhiều khoảng ngắt không cần thiết. Nên luyện nói dài hơn trước khi ngắt.",
    grammar: "7.0/10 – Sử dụng đúng các thì cơ bản. Cần cải thiện: mệnh đề quan hệ, câu điều kiện loại 2-3.",
    vocabulary: "6.5/10 – Vốn từ ở mức trung bình. Nên bổ sung thêm collocations và idioms phổ biến cho chủ đề này.",
    tips: [
      "Luyện shadowing với podcast tiếng Anh 15 phút/ngày để cải thiện phát âm và ngữ điệu",
      "Ghi âm bản thân và so sánh với native speaker",
      "Học thêm linking words: moreover, furthermore, on the other hand",
      "Thực hành trả lời câu hỏi trong 2 phút liên tục không ngắt",
      "Đọc thêm bài báo tiếng Anh để mở rộng vốn từ theo chủ đề",
    ],
  },
  2: {
    pronunciation: "7.5/10 – Phát âm khá rõ ràng, cần chú ý âm cuối /s/, /z/, /t/, /d/. Một số từ cần cải thiện: 'environment' (/ɪnˈvaɪrənmənt/), 'specifically' (/spəˈsɪfɪkli/).",
    fluency: "7.0/10 – Nói khá trôi chảy nhưng còn nhiều khoảng ngắt không cần thiết. Nên luyện nói dài hơn trước khi ngắt.",
    grammar: "7.0/10 – Sử dụng đúng các thì cơ bản. Cần cải thiện: mệnh đề quan hệ, câu điều kiện loại 2-3.",
    vocabulary: "6.5/10 – Vốn từ ở mức trung bình. Nên bổ sung thêm collocations và idioms phổ biến cho chủ đề này.",
    tips: [
      "Luyện shadowing với podcast tiếng Anh 15 phút/ngày để cải thiện phát âm và ngữ điệu",
      "Ghi âm bản thân và so sánh với native speaker",
      "Học thêm linking words: moreover, furthermore, on the other hand",
      "Thực hành trả lời câu hỏi trong 2 phút liên tục không ngắt",
      "Đọc thêm bài báo tiếng Anh để mở rộng vốn từ theo chủ đề",
    ],
  },
  3: {
    pronunciation: "7.5/10 – Phát âm khá rõ ràng, cần chú ý âm cuối /s/, /z/, /t/, /d/. Một số từ cần cải thiện: 'environment' (/ɪnˈvaɪrənmənt/), 'specifically' (/spəˈsɪfɪkli/).",
    fluency: "7.0/10 – Nói khá trôi chảy nhưng còn nhiều khoảng ngắt không cần thiết. Nên luyện nói dài hơn trước khi ngắt.",
    grammar: "7.0/10 – Sử dụng đúng các thì cơ bản. Cần cải thiện: mệnh đề quan hệ, câu điều kiện loại 2-3.",
    vocabulary: "6.5/10 – Vốn từ ở mức trung bình. Nên bổ sung thêm collocations và idioms phổ biến cho chủ đề này.",
    tips: [
      "Luyện shadowing với podcast tiếng Anh 15 phút/ngày để cải thiện phát âm và ngữ điệu",
      "Ghi âm bản thân và so sánh với native speaker",
      "Học thêm linking words: moreover, furthermore, on the other hand",
      "Thực hành trả lời câu hỏi trong 2 phút liên tục không ngắt",
      "Đọc thêm bài báo tiếng Anh để mở rộng vốn từ theo chủ đề",
    ],
  },
};
