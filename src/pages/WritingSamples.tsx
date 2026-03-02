import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SampleEssay {
  id: number;
  level: "B1" | "B2";
  score: string;
  content: string;
  reasons: string[];
}

const task1Samples: SampleEssay[] = [
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

const task2Samples: SampleEssay[] = [
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

const WritingSamples = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderSampleCard = (sample: SampleEssay) => (
    <Card key={sample.id} className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={sample.level === "B2" ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
              {sample.level}
            </Badge>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="font-bold text-foreground text-sm">{sample.score}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => toggleExpand(sample.id)} className="gap-1 text-xs">
            {expandedId === sample.id ? <><ChevronUp size={14} /> Thu gọn</> : <><ChevronDown size={14} /> Xem chi tiết</>}
          </Button>
        </div>

        {/* Preview */}
        <div className={`bg-muted/50 rounded-xl p-4 ${expandedId === sample.id ? "" : "max-h-32 overflow-hidden relative"}`}>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{sample.content}</p>
          {expandedId !== sample.id && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/50 to-transparent rounded-b-xl" />
          )}
        </div>

        {/* Reasons - shown when expanded */}
        {expandedId === sample.id && (
          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <BookOpen size={16} className="text-primary" /> Lý do đạt điểm {sample.score}
            </h4>
            <div className="space-y-2">
              {sample.reasons.map((reason, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
          <span className="font-bold text-foreground">Bài Mẫu Writing</span>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Bài mẫu <span className="text-gradient">Writing VSTEP</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tham khảo các bài viết mẫu đạt điểm 8+ ở trình độ B1 và B2. Mỗi bài đều có phân tích chi tiết lý do đạt điểm theo 4 tiêu chí chấm điểm VSTEP.
          </p>
        </div>

        <Tabs defaultValue="task1" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="task1">Task 1 – Letter / Email</TabsTrigger>
            <TabsTrigger value="task2">Task 2 – Essay</TabsTrigger>
          </TabsList>

          <TabsContent value="task1" className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h3 className="font-semibold text-foreground text-sm mb-2">📋 Đề bài Task 1</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have recently moved to a new city for work. Write a letter to your friend to: Tell him/her about your new city and your new job • Describe what you like and dislike about living there • Invite him/her to visit you. Write at least 120 words.
              </p>
            </div>
            {task1Samples.map(renderSampleCard)}
          </TabsContent>

          <TabsContent value="task2" className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h3 className="font-semibold text-foreground text-sm mb-2">📋 Đề bài Task 2</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Some people believe that technology has made our lives more complicated, while others think it has made life easier and more convenient. Discuss both views and give your own opinion. Write at least 250 words.
              </p>
            </div>
            {task2Samples.map(renderSampleCard)}
          </TabsContent>
        </Tabs>

        <div className="text-center pt-4">
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/quiz">Luyện viết ngay</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WritingSamples;
