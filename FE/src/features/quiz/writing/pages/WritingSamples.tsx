import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type SampleEssay } from "../mocks/writing.mock";
import { writingService } from "../services/writing.service";

const WritingSamples = () => {
  const [samplesData, setSamplesData] = useState<{
    task1Samples: SampleEssay[];
    task2Samples: SampleEssay[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    writingService.getWritingSamples().then((res) => {
      if (active) {
        setSamplesData(res);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading || !samplesData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải danh sách bài viết mẫu...</p>
        </div>
      </div>
    );
  }

  const { task1Samples, task2Samples } = samplesData;


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
