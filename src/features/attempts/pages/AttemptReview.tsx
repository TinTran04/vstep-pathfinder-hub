import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Headphones, BookOpen, Pen, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { attemptReviewApiService } from "../services/attempt-review.api-service";
import type { AttemptReviewResponse, SectionReviewResponse } from "../types";
import ListeningReview from "../components/review/ListeningReview";
import ReadingReview from "../components/review/ReadingReview";
import WritingReview from "../components/review/WritingReview";
import SpeakingReview from "../components/review/SpeakingReview";
import logoImg from "@/assets/logo.png";

const skillConfig = [
  { key: "listening" as const, label: "Listening", icon: <Headphones size={16} />, color: "text-blue-600" },
  { key: "reading" as const, label: "Reading", icon: <BookOpen size={16} />, color: "text-emerald-600" },
  { key: "writing" as const, label: "Writing", icon: <Pen size={16} />, color: "text-amber-600" },
  { key: "speaking" as const, label: "Speaking", icon: <Mic size={16} />, color: "text-purple-600" },
];

const AttemptReview = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<AttemptReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) {
      navigate("/quiz");
      return;
    }
    
    const fetchAttempt = async () => {
      try {
        const data = await attemptReviewApiService.getAttemptReview(attemptId);
        setAttempt(data);
      } catch (err) {
        console.error("Failed to load attempt review", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttempt();
  }, [attemptId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border text-center p-8 space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Không tìm thấy kết quả bài làm</h2>
          <p className="text-sm text-muted-foreground">Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.</p>
          <Button className="gradient-primary text-primary-foreground w-full" onClick={() => navigate("/quiz")}>
            Quay lại luyện đề
          </Button>
        </Card>
      </div>
    );
  }

  const hasListening = attempt.sections.some(s => s.audioUrl);
  const hasReading = attempt.sections.some(s => s.passageText);
  const hasWriting = !!attempt.writingReview;
  const hasSpeaking = !!attempt.speakingReview;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="VstepUp" className="w-7 h-7 rounded-lg object-contain" />
            </Link>
            <span className="font-bold text-foreground text-sm">Xem lại bài làm</span>
            <Badge className="gradient-primary text-primary-foreground text-xs">
              {attempt.skillType ? attempt.skillType.toUpperCase() : "MOCK TEST"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/attempts/${attempt.attemptId}/result`)} className="gap-1.5">
              Xem điểm số
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/quiz")}>
              <ArrowLeft size={16} className="mr-1" /> Trang luyện thi
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Attempt info header */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h2 className="text-xl font-bold text-foreground">Chi tiết câu trả lời</h2>
          <p className="text-xs text-muted-foreground">
            Đề thi: <span className="font-semibold text-foreground">{attempt.examTitle}</span>
            {attempt.submittedAt && ` • Nộp bài lúc: ${new Date(attempt.submittedAt).toLocaleString("vi-VN")}`}
          </p>
        </div>

        {/* Tabs per skill */}
        <Tabs defaultValue={hasListening ? "listening" : hasReading ? "reading" : hasWriting ? "writing" : "speaking"}>
          <TabsList className="w-full grid grid-cols-4">
            {skillConfig.map((s) => (
              <TabsTrigger key={s.key} value={s.key} className="flex items-center gap-1.5 text-xs md:text-sm">
                <span className={s.color}>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.label.slice(0, 1)}</span>
                {!(
                  (s.key === "listening" && hasListening) ||
                  (s.key === "reading" && hasReading) ||
                  (s.key === "writing" && hasWriting) ||
                  (s.key === "speaking" && hasSpeaking)
                ) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/45 ml-1" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="listening">
              {hasListening ? (
                <ListeningReview sections={attempt.sections.filter(s => s.audioUrl)} status={attempt.status} />
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
                  <Headphones size={32} className="mx-auto mb-3 opacity-30 animate-bounce" />
                  <p className="text-sm">Kỹ năng Listening không có trong lượt này.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reading">
              {hasReading ? (
                <ReadingReview sections={attempt.sections.filter(s => s.passageText)} status={attempt.status} />
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
                  <BookOpen size={32} className="mx-auto mb-3 opacity-30 animate-bounce" />
                  <p className="text-sm">Kỹ năng Reading không có trong lượt này.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="writing">
              {hasWriting ? (
                <WritingReview review={attempt.writingReview!} />
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
                  <Pen size={32} className="mx-auto mb-3 opacity-30 animate-bounce" />
                  <p className="text-sm">Kỹ năng Writing không có trong lượt này.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="speaking">
              {hasSpeaking ? (
                <SpeakingReview review={attempt.speakingReview!} />
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
                  <Mic size={32} className="mx-auto mb-3 opacity-30 animate-bounce" />
                  <p className="text-sm">Kỹ năng Speaking không có trong lượt này.</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AttemptReview;
