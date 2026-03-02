import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

const sampleQuestions: Question[] = [
  { id: 1, question: "What is the main purpose of the speaker's announcement?", options: ["To introduce a new policy", "To announce a schedule change", "To promote a new product", "To congratulate an employee"], correct: 1 },
  { id: 2, question: "According to the passage, what is the primary benefit of renewable energy?", options: ["Lower cost than fossil fuels", "Reducing carbon emissions", "Creating more jobs", "Being available everywhere"], correct: 1 },
  { id: 3, question: "Which word best describes the tone of the passage?", options: ["Humorous", "Informative", "Critical", "Emotional"], correct: 1 },
  { id: 4, question: "What does the speaker suggest about the new system?", options: ["It will be implemented next month", "It needs more testing", "It has been approved", "It replaces the old one completely"], correct: 2 },
  { id: 5, question: "Based on the information given, which statement is TRUE?", options: ["The project was delayed by 2 weeks", "The budget was increased by 15%", "Three new members joined the team", "The deadline remains unchanged"], correct: 0 },
  { id: 6, question: "What is the implied meaning of the phrase 'cutting corners'?", options: ["Saving money effectively", "Reducing quality to save time", "Finding shortcuts", "Making geometric shapes"], correct: 1 },
  { id: 7, question: "The speaker's attitude toward the proposal is best described as:", options: ["Enthusiastic", "Cautiously optimistic", "Indifferent", "Strongly opposed"], correct: 1 },
  { id: 8, question: "Which of the following is NOT mentioned in the passage?", options: ["Environmental impact", "Economic considerations", "Political implications", "Health benefits"], correct: 2 },
  { id: 9, question: "What can be inferred from the conversation?", options: ["They will meet again tomorrow", "The project is behind schedule", "Both speakers agree on the solution", "A decision has been postponed"], correct: 3 },
  { id: 10, question: "The word 'substantial' in line 5 is closest in meaning to:", options: ["Considerable", "Minimal", "Temporary", "Unexpected"], correct: 0 },
];

const QuizTake = () => {
  const { skill } = useParams();
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) { setSubmitted(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const score = submitted ? sampleQuestions.filter((q) => answers[q.id] === q.correct).length : 0;
  const total = sampleQuestions.length;
  const q = sampleQuestions[currentQ];

  const handleSubmit = () => setSubmitted(true);

  const reset = () => {
    setAnswers({});
    setCurrentQ(0);
    setSubmitted(false);
    setTimeLeft(30 * 60);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-border">
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${score >= 7 ? "bg-emerald-100" : score >= 5 ? "bg-amber-100" : "bg-red-100"}`}>
              {score >= 7 ? <CheckCircle2 size={40} className="text-emerald-600" /> : <XCircle size={40} className={score >= 5 ? "text-amber-600" : "text-red-600"} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Kết quả bài thi</h2>
              <p className="text-muted-foreground mt-1 capitalize">{skill}</p>
            </div>
            <div className="text-5xl font-bold text-foreground">{score}<span className="text-2xl text-muted-foreground">/{total}</span></div>
            <p className="text-muted-foreground">
              {score >= 7 ? "Xuất sắc! Bạn đã nắm vững kiến thức." : score >= 5 ? "Khá tốt! Hãy ôn lại các câu sai." : "Cần cải thiện thêm. Hãy luyện tập nhiều hơn."}
            </p>

            {/* Review answers */}
            <div className="text-left space-y-3 max-h-60 overflow-y-auto">
              {sampleQuestions.map((sq, i) => (
                <div key={sq.id} className={`p-3 rounded-xl text-sm ${answers[sq.id] === sq.correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                  <p className="font-medium text-foreground">Câu {i + 1}: {sq.question.slice(0, 60)}...</p>
                  <p className="text-xs mt-1">
                    {answers[sq.id] === sq.correct ? (
                      <span className="text-emerald-700">✓ Đúng: {sq.options[sq.correct]}</span>
                    ) : (
                      <span className="text-red-700">✗ Đáp án đúng: {sq.options[sq.correct]}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate(`/quiz`)}>
                <ArrowLeft size={16} /> Quay lại
              </Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={reset}>
                <RotateCcw size={16} /> Làm lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Thoát
          </button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock size={16} className={timeLeft < 300 ? "text-destructive" : "text-muted-foreground"} />
            <span className={timeLeft < 300 ? "text-destructive" : "text-foreground"}>{formatTime(timeLeft)}</span>
          </div>
          <span className="text-sm text-muted-foreground">Câu {currentQ + 1}/{total}</span>
        </div>
        <Progress value={((currentQ + 1) / total) * 100} className="h-1" />
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Question navigation dots */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {sampleQuestions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                i === currentQ
                  ? "gradient-primary text-primary-foreground"
                  : answers[sampleQuestions[i].id] !== undefined
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question */}
        <Card className="border-border">
          <CardContent className="p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              <span className="text-primary mr-2">Câu {currentQ + 1}.</span>
              {q.question}
            </h2>

            <RadioGroup
              value={answers[q.id]?.toString()}
              onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: parseInt(v) }))}
              className="space-y-3"
            >
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    answers[q.id] === i
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={i.toString()} id={`q${q.id}-o${i}`} />
                  <Label htmlFor={`q${q.id}-o${i}`} className="cursor-pointer flex-1 text-sm text-foreground">
                    <span className="font-medium text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </Label>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((c) => c - 1)}>
            <ArrowLeft size={16} /> Câu trước
          </Button>

          {currentQ === total - 1 ? (
            <Button className="gradient-primary text-primary-foreground" onClick={handleSubmit}>
              Nộp bài
            </Button>
          ) : (
            <Button onClick={() => setCurrentQ((c) => c + 1)}>
              Câu tiếp <ArrowRight size={16} />
            </Button>
          )}
        </div>

        {/* Answered count */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Đã trả lời {Object.keys(answers).length}/{total} câu
        </p>
      </div>
    </div>
  );
};

export default QuizTake;
