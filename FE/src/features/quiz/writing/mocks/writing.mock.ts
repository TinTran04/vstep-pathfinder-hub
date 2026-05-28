export interface WritingTask {
  id: number;
  title: string;
  type: string;
  duration: string;
  minWords: number;
  recommendedWords: string;
  scoreWeight: string;
  prompt: string;
  instructions: string[];
}

export const tasks: WritingTask[] = [
  {
    id: 1,
    title: "Task 1 – Viết thư/Email hoặc Tóm tắt",
    type: "Viết thư / Email",
    duration: "20 phút",
    minWords: 120,
    recommendedWords: "150–200 từ",
    scoreWeight: "1/3 tổng điểm (~3.3/10)",
    prompt: "You have recently moved to a new city for work. Write a letter to your friend to:\n\n• Tell him/her about your new city and your new job\n• Describe what you like and dislike about living there\n• Invite him/her to visit you\n\nWrite at least 120 words. You should use an informal style.",
    instructions: [
      "Viết một lá thư/email (thân mật hoặc trang trọng) theo yêu cầu đề bài",
      "Tối thiểu 120 từ (Khuyến nghị 150–200)",
      "Đảm bảo đầy đủ 3 ý trong đề bài",
      "Sử dụng cấu trúc thư phù hợp: lời chào, nội dung, kết thư",
    ],
  },
  {
    id: 2,
    title: "Task 2 – Writing Essay",
    type: "Viết bài luận",
    duration: "40 phút",
    minWords: 250,
    recommendedWords: "250–300 từ",
    scoreWeight: "2/3 tổng điểm (~6.7/10)",
    prompt: "Some people believe that technology has made our lives more complicated, while others think it has made life easier and more convenient.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words. Support your arguments with reasons and examples.",
    instructions: [
      "Viết một bài luận theo đề tài được cho",
      "Tối thiểu 250 từ (Khuyến nghị 270–300)",
      "Trình bày cả hai quan điểm và đưa ra ý kiến cá nhân",
      "Sử dụng cấu trúc rõ ràng: Mở bài, Thân bài, Kết luận",
      "Dùng từ nối, ví dụ minh họa và lập luận chặt chẽ",
    ],
  },
];

export const sampleEssays: Record<number, { level: string; content: string }> = {
  1: {
    level: "B2 (8.5/10)",
    content: `Dear Tom,

I hope this letter finds you well! I'm writing to share some exciting news about my new life in Da Nang.

I moved here three weeks ago for a marketing position at a tech startup. The company culture is fantastic — my colleagues are supportive, and the work is challenging yet rewarding. I'm particularly enjoying the creative freedom I have in developing campaigns for Vietnamese and international markets.

Da Nang has been a wonderful surprise. The beaches are absolutely stunning, especially My Khe Beach, which is just a 10-minute drive from my apartment. The food scene is incredible too — I've been eating bun cha ca almost every day! The cost of living is significantly lower than Ho Chi Minh City, which means I can save more while enjoying a higher quality of life.

However, there are a few things I'm still adjusting to. The city is quieter than what I'm used to, and the nightlife options are somewhat limited. Also, the summer heat can be quite intense, reaching up to 38°C some days.

I would absolutely love it if you could come visit me! There's so much to explore here — the Marble Mountains, Ba Na Hills, and the ancient town of Hoi An is just 30 minutes away. You're welcome to stay at my place anytime.

Looking forward to hearing from you soon!

Warm regards,
Minh

(Word count: 208)`,
  },
  2: {
    level: "B2 (8.0/10)",
    content: `Technology: A Double-Edged Sword in Modern Life

The rapid advancement of technology has sparked a heated debate about whether it simplifies or complicates our daily existence. While some argue that technological innovations have introduced unnecessary complexity, others maintain that they have streamlined our lives in unprecedented ways. This essay will examine both perspectives before presenting my own viewpoint.

On one hand, technology has undeniably made certain aspects of life more complicated. The constant connectivity through smartphones and social media has blurred the boundaries between work and personal life, leading to increased stress and burnout. Furthermore, the overwhelming amount of information available online can cause decision fatigue and anxiety. Cybersecurity threats, privacy concerns, and the need to constantly update skills to keep pace with technological changes add further layers of complexity to modern life.

On the other hand, proponents of technology highlight its remarkable contributions to convenience and efficiency. Online banking, e-commerce, and digital communication have eliminated geographical barriers and saved countless hours previously spent on mundane tasks. In healthcare, technological innovations such as telemedicine and AI-assisted diagnostics have improved access to medical services, particularly in remote areas. Moreover, educational technology has democratized learning, making quality education accessible to millions worldwide through platforms like Coursera and Khan Academy.

In my opinion, while technology does introduce certain challenges, its benefits far outweigh the drawbacks. The key lies in developing digital literacy and maintaining a healthy relationship with technology. By setting boundaries for screen time, staying informed about online security, and embracing lifelong learning, individuals can harness the power of technology while minimizing its negative effects.

In conclusion, technology is a powerful tool that, when used wisely, significantly enhances our quality of life. Rather than viewing it as a source of complication, we should focus on cultivating the skills needed to navigate the digital landscape effectively.

(Word count: 280)`,
  },
};

export interface GrammarPattern {
  regex: RegExp;
  suggestion: string | ((m: string) => string);
  explanation: string;
  type: "grammar" | "spelling" | "vocabulary" | "coherence";
}

export const writingGrammarPatterns: GrammarPattern[] = [
  { regex: /\b(i)\b/g, suggestion: "I", explanation: "Đại từ nhân xưng 'I' luôn viết hoa.", type: "grammar" },
  { regex: /\b(dont|doesnt|didnt|cant|wont|isnt|arent|wasnt|werent|havent|hasnt|hadnt)\b/gi, suggestion: (m: string) => m.replace(/nt$/i, "n't"), explanation: "Cần thêm dấu nháy cho dạng rút gọn.", type: "spelling" },
  { regex: /\b(alot)\b/gi, suggestion: "a lot", explanation: "'A lot' viết tách thành 2 từ.", type: "spelling" },
  { regex: /\b(becuz|bcuz|cuz)\b/gi, suggestion: "because", explanation: "Sử dụng từ đầy đủ 'because' trong bài viết chính thức.", type: "vocabulary" },
  { regex: /\b(gonna)\b/gi, suggestion: "going to", explanation: "'Gonna' là dạng nói, dùng 'going to' trong viết.", type: "vocabulary" },
  { regex: /\b(wanna)\b/gi, suggestion: "want to", explanation: "'Wanna' là dạng nói, dùng 'want to' trong viết.", type: "vocabulary" },
  { regex: /\b(wich|whitch)\b/gi, suggestion: "which", explanation: "Lỗi chính tả: đúng là 'which'.", type: "spelling" },
  { regex: /\b(recieve)\b/gi, suggestion: "receive", explanation: "Lỗi chính tả: đúng là 'receive' (i trước e sau c).", type: "spelling" },
  { regex: /\b(definately|definatly)\b/gi, suggestion: "definitely", explanation: "Lỗi chính tả: đúng là 'definitely'.", type: "spelling" },
  { regex: /\b(their|there|they're)\b/gi, suggestion: "", explanation: "Kiểm tra lại: their (sở hữu), there (nơi đó), they're (they are).", type: "grammar" },
  { regex: /\b(very good)\b/gi, suggestion: "excellent / outstanding", explanation: "Thay 'very good' bằng từ mạnh hơn để nâng điểm từ vựng.", type: "vocabulary" },
  { regex: /\b(very bad)\b/gi, suggestion: "terrible / dreadful", explanation: "Thay 'very bad' bằng từ mạnh hơn.", type: "vocabulary" },
  { regex: /\b(very big)\b/gi, suggestion: "enormous / massive", explanation: "Dùng từ mạnh hơn thay cho 'very + adj'.", type: "vocabulary" },
  { regex: /\b(very small)\b/gi, suggestion: "tiny / minuscule", explanation: "Dùng từ mạnh hơn thay cho 'very + adj'.", type: "vocabulary" },
  { regex: /\b(He go|She go|It go)\b/g, suggestion: (m: string) => m.replace("go", "goes"), explanation: "Chia động từ ngôi thứ 3 số ít: thêm -s/-es.", type: "grammar" },
  { regex: /\b(childs)\b/gi, suggestion: "children", explanation: "Danh từ bất quy tắc: child → children.", type: "grammar" },
  { regex: /\b(mans)\b/gi, suggestion: "men", explanation: "Danh từ bất quy tắc: man → men.", type: "grammar" },
  { regex: /\b(womans)\b/gi, suggestion: "women", explanation: "Danh từ bất quy tắc: woman → women.", type: "grammar" },
  { regex: /\b(informations)\b/gi, suggestion: "information", explanation: "'Information' là danh từ không đếm được, không thêm -s.", type: "grammar" },
  { regex: /\b(advices)\b/gi, suggestion: "advice", explanation: "'Advice' là danh từ không đếm được.", type: "grammar" },
  { regex: /\.\s*However\s+/g, suggestion: ". However, ", explanation: "Sau 'However' cần dấu phẩy.", type: "coherence" },
  { regex: /\.\s*Moreover\s+(?!,)/g, suggestion: ". Moreover, ", explanation: "Sau 'Moreover' cần dấu phẩy.", type: "coherence" },
  { regex: /\.\s*Furthermore\s+(?!,)/g, suggestion: ". Furthermore, ", explanation: "Sau 'Furthermore' cần dấu phẩy.", type: "coherence" },
  { regex: /\.\s*In addition\s+(?!,)/g, suggestion: ". In addition, ", explanation: "Sau 'In addition' cần dấu phẩy.", type: "coherence" },
];

export interface FeedbackTemplate {
  taskAchievement: string;
  coherence: string;
  lexical: string;
  grammar: string;
  score: string;
  tips: string[];
}

export const writingFeedbackAITemplates: Record<number, FeedbackTemplate> = {
  1: {
    taskAchievement: "7.5/10 – Hoàn thành đủ 3 ý trong đề bài. Phần mời bạn đến thăm có thể mở rộng thêm chi tiết cụ thể.",
    coherence: "7.0/10 – Bài viết có cấu trúc rõ ràng (mở – thân – kết). Tuy nhiên cần sử dụng thêm từ nối giữa các đoạn.",
    lexical: "7.0/10 – Vốn từ đa dạng ở mức trung bình. Nên dùng thêm collocations và tránh lặp từ.",
    grammar: "7.5/10 – Sử dụng đúng thì và cấu trúc câu cơ bản. Cần cải thiện câu phức và mệnh đề quan hệ.",
    score: "7.3/10",
    tips: [
      "Luyện viết email theo template: Greeting → Reason → Details → Closing",
      "Học thêm formal/informal expressions phù hợp với từng loại thư",
      "Đọc mẫu email chuẩn VSTEP B2 để nắm cấu trúc",
      "Thực hành viết 1 email/ngày trong 15 phút",
    ],
  },
  2: {
    taskAchievement: "7.0/10 – Đã trình bày cả 2 quan điểm và đưa ra ý kiến cá nhân. Cần thêm ví dụ cụ thể để minh họa.",
    coherence: "7.5/10 – Cấu trúc bài luận tốt với mở bài, thân bài, kết luận rõ ràng. Sử dụng từ nối hợp lý.",
    lexical: "6.5/10 – Vốn từ còn hạn chế, hay lặp từ. Nên sử dụng synonyms và academic vocabulary.",
    grammar: "7.0/10 – Có một số lỗi về sự hòa hợp chủ-vị và mạo từ. Câu phức cần chính xác hơn.",
    score: "7.0/10",
    tips: [
      "Học cấu trúc bài luận: Introduction → Body 1 (View A) → Body 2 (View B) → Opinion → Conclusion",
      "Mỗi body paragraph nên có: Topic sentence → Explanation → Example → Link",
      "Tích lũy Academic Word List (AWL) để nâng band từ vựng",
      "Viết ít nhất 2 bài luận/tuần và tự chấm theo 4 tiêu chí",
      "Đọc essays mẫu band 8+ để học cách diễn đạt",
    ],
  },
};

export interface SampleEssay {
  id: number;
  level: "B1" | "B2";
  score: string;
  content: string;
  reasons: string[];
}

export const task1Samples: SampleEssay[] = [
  {
    id: 1,
    level: "B2",
    score: "8.5/10",
    content: `Dear Tom,

I hope this letter finds you well! I'm writing to share some exciting news about my new life in Da Nang.

I moved here three weeks ago for a marketing position at a tech startup. The company culture is fantastic — my colleagues are supportive, and the work is challenging yet rewarding. I'm particularly enjoying the creative freedom I have in developing campaigns for Vietnamese and international markets.

Da Nang has been a wonderful surprise. The beaches are absolutely stunning, especially My Khe Beach, which is just a 10-minute drive from my apartment. The food scene is incredible too — I've been eating bun cha ca almost every day! The cost of living is significantly lower than Ho Chi Minh City, which means I can save more while enjoying a higher quality of life.

However, there are a few things I'm still adjusting to. The city is quieter than what I'm used to, and the nightlife options are somewhat limited. Also, the summer heat can be quite intense, reaching up to 38°C some days.

I would absolutely love it if you could come visit me! There's so much to explore here — the Marble Mountains, Ba Na Hills, and the ancient town of Hoi An is just 30 minutes away. You're welcome to stay at my place anytime.

Looking forward to hearing from you soon!

Warm regards,
Minh

(Word count: 208)`,
    reasons: [
      "Task Achievement (8.5): Hoàn thành đầy đủ 3 ý trong đề bài (công việc mới, thành phố mới, mời bạn đến thăm). Mỗi ý được triển khai chi tiết với ví dụ cụ thể.",
      "Coherence & Cohesion (8.5): Cấu trúc thư rõ ràng (Greeting → Body → Closing). Sử dụng từ nối tự nhiên: 'However', 'Also', 'which means'. Luồng ý mạch lạc.",
      "Lexical Resource (8.0): Vốn từ phong phú và đa dạng: 'challenging yet rewarding', 'creative freedom', 'significantly lower'. Sử dụng collocations tốt.",
      "Grammar Range & Accuracy (9.0): Sử dụng đúng nhiều cấu trúc phức: mệnh đề quan hệ ('which is just...'), câu điều kiện, thì hiện tại hoàn thành. Rất ít lỗi ngữ pháp.",
    ],
  },
  {
    id: 2,
    level: "B1",
    score: "8.0/10",
    content: `Dear Sarah,

How are you? I hope you are doing well. I am writing to tell you about my new life in Hanoi.

I started working at a language center two weeks ago. My job is to teach English to children. The students are very cute and I enjoy teaching them. My boss is very kind and helpful.

Hanoi is a big city with many interesting places. I like the food here very much, especially pho and bun cha. The Old Quarter is beautiful and I often go there on weekends. However, the traffic is very busy and the weather is quite cold in winter.

I want to invite you to come and visit me in Hanoi. We can visit Ho Chi Minh Mausoleum, the Temple of Literature and many other places together. I am sure you will love it here.

Please write back to me soon. I miss you very much!

Best wishes,
Lan

(Word count: 155)`,
    reasons: [
      "Task Achievement (8.0): Đáp ứng đủ 3 yêu cầu đề bài. Nội dung rõ ràng, dễ hiểu. Phù hợp trình độ B1 với độ dài vừa đủ.",
      "Coherence & Cohesion (8.0): Cấu trúc thư đơn giản nhưng đúng format. Sử dụng từ nối cơ bản: 'However', 'and', 'I am sure'. Dễ theo dõi.",
      "Lexical Resource (7.5): Từ vựng phù hợp trình độ B1. Sử dụng đúng các cụm từ thông dụng. Có thể mở rộng thêm synonyms.",
      "Grammar Range & Accuracy (8.5): Câu đơn và câu ghép chính xác. Thì hiện tại đơn và quá khứ đơn dùng đúng. Ít lỗi ngữ pháp.",
    ],
  },
];

export const task2Samples: SampleEssay[] = [
  {
    id: 3,
    level: "B2",
    score: "8.0/10",
    content: `Technology: A Double-Edged Sword in Modern Life

The rapid advancement of technology has sparked a heated debate about whether it simplifies or complicates our daily existence. While some argue that technological innovations have introduced unnecessary complexity, others maintain that they have streamlined our lives in unprecedented ways. This essay will examine both perspectives before presenting my own viewpoint.

On one hand, technology has undeniably made certain aspects of life more complicated. The constant connectivity through smartphones and social media has blurred the boundaries between work and personal life, leading to increased stress and burnout. Furthermore, the overwhelming amount of information available online can cause decision fatigue and anxiety. Cybersecurity threats, privacy concerns, and the need to constantly update skills to keep pace with technological changes add further layers of complexity to modern life.

On the other hand, proponents of technology highlight its remarkable contributions to convenience and efficiency. Online banking, e-commerce, and digital communication have eliminated geographical barriers and saved countless hours previously spent on mundane tasks. In healthcare, technological innovations such as telemedicine and AI-assisted diagnostics have improved access to medical services, particularly in remote areas. Moreover, educational technology has democratized learning, making quality education accessible to millions worldwide through platforms like Coursera and Khan Academy.

In my opinion, while technology does introduce certain challenges, its benefits far outweigh the drawbacks. The key lies in developing digital literacy and maintaining a healthy relationship with technology. By setting boundaries for screen time, staying informed about online security, and embracing lifelong learning, individuals can harness the power of technology while minimizing its negative effects.

In conclusion, technology is a powerful tool that, when used wisely, significantly enhances our quality of life. Rather than viewing it as a source of complication, we should focus on cultivating the skills needed to navigate the digital landscape effectively.

(Word count: 280)`,
    reasons: [
      "Task Achievement (8.0): Trình bày đầy đủ cả 2 quan điểm với ví dụ cụ thể. Đưa ra ý kiến cá nhân rõ ràng ở đoạn cuối. Bài viết đủ độ dài và sâu.",
      "Coherence & Cohesion (8.5): Cấu trúc essay hoàn chỉnh (Introduction → Body 1 → Body 2 → Opinion → Conclusion). Từ nối đa dạng: 'On one hand', 'Furthermore', 'Moreover', 'In my opinion'.",
      "Lexical Resource (8.0): Sử dụng academic vocabulary phong phú: 'sparked a heated debate', 'unprecedented ways', 'democratized learning'. Paraphrase tốt, tránh lặp từ.",
      "Grammar Range & Accuracy (7.5): Cấu trúc câu đa dạng: câu phức, mệnh đề phân từ, bị động. Có một vài lỗi nhỏ về mạo từ nhưng không ảnh hưởng nghĩa.",
    ],
  },
  {
    id: 4,
    level: "B1",
    score: "8.0/10",
    content: `Nowadays, many people discuss whether technology makes our lives easier or more difficult. I think this is an important topic because technology is everywhere in our daily life.

Some people believe that technology makes life more complicated. First, many people spend too much time on their phones and computers. This can be bad for their health and relationships. Second, some older people find it difficult to use new technology. They feel confused when they have to use online services or smartphones. Third, there are problems with online safety. Many people worry about losing their personal information on the internet.

However, other people think technology makes life much easier. For example, we can use the internet to study, work and communicate with friends and family anywhere in the world. Shopping online saves us a lot of time because we do not need to go to the store. Also, doctors can use technology to help patients better. For instance, they can check patients' health through video calls.

In my opinion, I agree that technology makes our lives easier. Although there are some problems, the advantages of technology are more important. I think we should learn how to use technology wisely and carefully.

In conclusion, technology has both good and bad sides. But if we use it properly, it will help us have a better life.

(Word count: 210)`,
    reasons: [
      "Task Achievement (8.0): Trình bày đủ 2 quan điểm và ý kiến cá nhân. Dùng ví dụ đơn giản nhưng hiệu quả. Phù hợp trình độ B1.",
      "Coherence & Cohesion (8.0): Cấu trúc rõ ràng với 'First, Second, Third' và 'However', 'Also', 'In conclusion'. Logic mạch lạc, dễ hiểu.",
      "Lexical Resource (7.5): Từ vựng phù hợp B1: 'daily life', 'personal information', 'advantages'. Có thể cải thiện bằng cách dùng thêm synonyms.",
      "Grammar Range & Accuracy (8.5): Câu đơn và câu ghép chính xác. Sử dụng đúng thì và cấu trúc 'Although', 'If'. Rất ít lỗi ngữ pháp.",
    ],
  },
];
