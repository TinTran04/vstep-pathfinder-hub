import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, RotateCcw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Question { id: number; question: string; options: string[]; correct: number; }

interface Passage { title: string; content: string; questions: Question[]; }

const passages: Passage[] = [
  {
    title: "Passage 1: The Impact of Technology on Education",
    content: `The integration of technology into education has fundamentally transformed how students learn and how teachers instruct. Over the past two decades, classrooms have shifted from traditional chalk-and-board settings to dynamic, digitally-enhanced learning environments.\n\nOne of the most significant changes has been the rise of online learning platforms. These platforms offer students access to a vast array of courses and materials that were previously unavailable. Students can now learn at their own pace, revisiting complex topics as needed and advancing quickly through material they find straightforward.\n\nHowever, the digital divide remains a pressing concern. Not all students have equal access to technology, and this inequality can exacerbate existing educational disparities. Rural areas and low-income communities often lack the infrastructure necessary to support digital learning, leaving some students at a disadvantage.\n\nFurthermore, the role of the teacher has evolved. Rather than being the sole source of knowledge, teachers now serve as facilitators and guides, helping students navigate the wealth of information available online. This shift requires new skills and approaches to pedagogy.\n\nResearch suggests that blended learning approaches, which combine online and face-to-face instruction, tend to produce the best outcomes. These models leverage the flexibility of digital tools while maintaining the personal interaction that is crucial for student engagement and motivation.\n\nDespite the challenges, the potential benefits of educational technology are immense. When implemented thoughtfully, technology can personalize learning, increase engagement, and prepare students for a digital workforce. The key lies in ensuring equitable access and providing adequate training for educators.`,
    questions: [
      { id: 1, question: "What is the main idea of the passage?", options: ["Technology has replaced teachers", "Technology has transformed education with both benefits and challenges", "Online learning is superior to traditional methods", "Rural students cannot learn effectively"], correct: 1 },
      { id: 2, question: "According to the passage, what is the 'digital divide'?", options: ["A type of software", "The gap in technology access among different groups", "A teaching method", "A type of online course"], correct: 1 },
      { id: 3, question: "How has the role of teachers changed?", options: ["Teachers are no longer needed", "Teachers now only grade papers", "Teachers have become facilitators and guides", "Teachers refuse to use technology"], correct: 2 },
      { id: 4, question: "What learning approach does research favor?", options: ["Purely online learning", "Traditional classroom only", "Blended learning combining online and face-to-face", "Self-study without guidance"], correct: 2 },
      { id: 5, question: "The word 'exacerbate' in paragraph 3 is closest in meaning to:", options: ["Reduce", "Worsen", "Explain", "Discover"], correct: 1 },
      { id: 6, question: "What is NOT mentioned as a benefit of educational technology?", options: ["Personalized learning", "Increased engagement", "Lower tuition costs", "Workforce preparation"], correct: 2 },
      { id: 7, question: "Which group is most affected by the digital divide?", options: ["University professors", "Urban students", "Rural and low-income communities", "Government officials"], correct: 2 },
      { id: 8, question: "What does the author suggest is key to successful technology integration?", options: ["Buying expensive equipment", "Equitable access and teacher training", "Eliminating traditional methods", "Reducing class sizes"], correct: 1 },
      { id: 9, question: "What can be inferred about the author's attitude?", options: ["Completely against technology", "Cautiously optimistic", "Indifferent", "Strongly negative"], correct: 1 },
      { id: 10, question: "The passage is most likely from:", options: ["A fiction novel", "An academic journal on education", "A cooking magazine", "A sports report"], correct: 1 },
    ],
  },
  {
    title: "Passage 2: Climate Change and Its Effects on Biodiversity",
    content: `Climate change is increasingly recognized as one of the greatest threats to global biodiversity. Rising temperatures, changing precipitation patterns, and more frequent extreme weather events are altering ecosystems worldwide, putting countless species at risk.\n\nCoral reefs, often called the rainforests of the sea, are particularly vulnerable. As ocean temperatures rise, corals undergo bleaching events, expelling the symbiotic algae that provide them with nutrients and color. Without these algae, the corals weaken and often die, devastating the marine ecosystems that depend on them.\n\nOn land, shifting climate zones are forcing many species to migrate to higher altitudes or latitudes in search of suitable habitats. However, not all species can adapt quickly enough, and those with limited mobility or specialized habitat requirements face the greatest risk of extinction.\n\nThe loss of biodiversity has far-reaching consequences beyond the natural world. Ecosystem services that humans rely on, such as pollination, water purification, and carbon sequestration, are directly linked to healthy, diverse ecosystems. The decline of key species can trigger cascading effects throughout food webs.\n\nConservation efforts must adapt to address climate-related threats. Protected areas may need to be redesigned to account for shifting species ranges, and corridors connecting fragmented habitats could facilitate species migration. Additionally, reducing greenhouse gas emissions remains the most effective long-term strategy for preserving biodiversity.\n\nInternational cooperation is essential, as climate change and biodiversity loss are global challenges that transcend national borders. Treaties such as the Paris Agreement and the Convention on Biological Diversity provide frameworks for collective action, but stronger commitments and enforcement are needed.`,
    questions: [
      { id: 11, question: "What is the primary focus of this passage?", options: ["Ocean pollution", "The impact of climate change on biodiversity", "Forest management", "Urban development"], correct: 1 },
      { id: 12, question: "What happens during coral bleaching?", options: ["Corals grow faster", "Corals expel symbiotic algae", "Corals change their shape", "Corals attract more fish"], correct: 1 },
      { id: 13, question: "Why are some species unable to adapt to changing climates?", options: ["They are too large", "They have limited mobility or specialized requirements", "They prefer warmer weather", "They eat too much"], correct: 1 },
      { id: 14, question: "What are 'ecosystem services'?", options: ["Cleaning services for nature reserves", "Benefits humans receive from healthy ecosystems", "Government environmental agencies", "Scientific research projects"], correct: 1 },
      { id: 15, question: "The word 'cascading' in paragraph 4 means:", options: ["Falling in stages", "Growing slowly", "Stopping completely", "Reversing direction"], correct: 0 },
      { id: 16, question: "What conservation strategy is suggested for shifting species ranges?", options: ["Building walls", "Redesigning protected areas and creating corridors", "Capturing all animals", "Stopping all human activity"], correct: 1 },
      { id: 17, question: "According to the passage, what is the most effective long-term strategy?", options: ["Building more zoos", "Reducing greenhouse gas emissions", "Planting more trees only", "Banning fishing"], correct: 1 },
      { id: 18, question: "What role does international cooperation play?", options: ["It is unnecessary", "It is essential for addressing global challenges", "It only helps rich countries", "It slows down progress"], correct: 1 },
      { id: 19, question: "Which of the following is NOT mentioned as an ecosystem service?", options: ["Pollination", "Water purification", "Entertainment", "Carbon sequestration"], correct: 2 },
      { id: 20, question: "The tone of the passage is best described as:", options: ["Humorous", "Informative and urgent", "Casual", "Sarcastic"], correct: 1 },
    ],
  },
  {
    title: "Passage 3: The Psychology of Decision Making",
    content: `Every day, humans make thousands of decisions, from trivial choices like what to eat for breakfast to life-altering ones such as choosing a career path. Understanding the psychological mechanisms behind decision-making has been a central focus of cognitive psychology and behavioral economics.\n\nOne of the most influential frameworks is the dual-process theory, which proposes that thinking operates on two levels. System 1 thinking is fast, automatic, and intuitive—it helps us make quick judgments based on patterns and past experiences. System 2 thinking is slow, deliberate, and analytical—it is engaged when we need to solve complex problems or evaluate evidence carefully.\n\nCognitive biases play a significant role in shaping our decisions. Confirmation bias, for instance, leads us to favor information that supports our existing beliefs while dismissing contradictory evidence. The anchoring effect causes us to rely too heavily on the first piece of information we encounter when making judgments.\n\nEmotions also profoundly influence decision-making. Research by neuroscientist Antonio Damasio demonstrated that individuals with damage to emotion-processing brain regions struggle to make even simple decisions, suggesting that emotions are not obstacles to rational choice but essential components of it.\n\nThe concept of bounded rationality, introduced by Herbert Simon, acknowledges that humans do not have unlimited cognitive resources. Instead of seeking optimal solutions, people often settle for satisfactory ones—a strategy known as satisficing. This approach is adaptive in environments where time and information are limited.\n\nUnderstanding these processes has practical applications in fields ranging from marketing to public policy. By recognizing common biases and heuristics, decision-makers can design better systems and environments that help people make more informed choices.`,
    questions: [
      { id: 21, question: "What is the main topic of this passage?", options: ["Marketing strategies", "The psychology of decision making", "Brain surgery techniques", "Educational reform"], correct: 1 },
      { id: 22, question: "What is System 1 thinking characterized by?", options: ["Slow and deliberate", "Fast, automatic, and intuitive", "Only used in emergencies", "Always logical"], correct: 1 },
      { id: 23, question: "What is confirmation bias?", options: ["Confirming appointments", "Favoring information that supports existing beliefs", "A type of memory loss", "A learning technique"], correct: 1 },
      { id: 24, question: "What did Damasio's research show about emotions?", options: ["Emotions always lead to bad decisions", "Emotions are essential for decision-making", "Emotions should be suppressed", "Emotions only affect children"], correct: 1 },
      { id: 25, question: "What is 'satisficing'?", options: ["Being satisfied with everything", "Settling for satisfactory rather than optimal solutions", "A cooking technique", "A type of exercise"], correct: 1 },
      { id: 26, question: "Who introduced the concept of bounded rationality?", options: ["Antonio Damasio", "Herbert Simon", "Daniel Kahneman", "Albert Einstein"], correct: 1 },
      { id: 27, question: "The anchoring effect refers to:", options: ["Sailing terminology", "Over-relying on the first piece of information encountered", "A type of cognitive therapy", "Physical exercise"], correct: 1 },
      { id: 28, question: "According to the passage, System 2 thinking is used when:", options: ["Eating breakfast", "Solving complex problems", "Sleeping", "Watching TV"], correct: 1 },
      { id: 29, question: "What practical application is mentioned?", options: ["Building bridges", "Designing better decision-making environments", "Growing crops", "Training athletes"], correct: 1 },
      { id: 30, question: "The passage suggests that humans:", options: ["Always make perfect decisions", "Have unlimited cognitive resources", "Often use shortcuts (heuristics) in decision-making", "Never use emotions"], correct: 2 },
    ],
  },
  {
    title: "Passage 4: Sustainable Urban Development",
    content: `As the global population continues to urbanize, with projections suggesting that 68% of people will live in cities by 2050, the concept of sustainable urban development has become increasingly critical. Cities are major contributors to greenhouse gas emissions, resource consumption, and waste generation, making them both part of the problem and essential to the solution.\n\nGreen building practices represent one key aspect of sustainable urbanism. Energy-efficient designs, renewable energy integration, and sustainable materials can significantly reduce the environmental footprint of urban structures. The LEED (Leadership in Energy and Environmental Design) certification system has become a widely recognized standard for green buildings.\n\nTransportation is another crucial factor. Cities that prioritize public transit, cycling infrastructure, and walkability tend to have lower per-capita carbon emissions than those dependent on private automobiles. Transit-oriented development, which concentrates housing and commercial activities near public transportation hubs, has proven effective in reducing urban sprawl and commuting distances.\n\nUrban green spaces—parks, community gardens, and green corridors—provide multiple benefits. They improve air quality, reduce the urban heat island effect, support biodiversity, and enhance residents' physical and mental well-being. Some cities have adopted ambitious greening programs, incorporating vegetation into building designs through green roofs and vertical gardens.\n\nSmart city technologies offer promising tools for sustainability. Sensors, data analytics, and IoT (Internet of Things) devices can optimize energy use, manage traffic flow, monitor air quality, and improve waste management. However, these technologies also raise concerns about privacy and digital equity.\n\nSuccessful sustainable urban development requires integrated planning that considers environmental, social, and economic dimensions simultaneously. Community engagement is essential to ensure that sustainability initiatives are equitable and responsive to the needs of all residents, particularly vulnerable populations.`,
    questions: [
      { id: 31, question: "What percentage of people are projected to live in cities by 2050?", options: ["50%", "58%", "68%", "78%"], correct: 2 },
      { id: 32, question: "What does LEED stand for?", options: ["Leadership in Energy and Environmental Design", "Low Energy Efficient Development", "Leading Environmental Education Division", "Local Energy and Ecology Department"], correct: 0 },
      { id: 33, question: "What type of development reduces urban sprawl?", options: ["Suburban expansion", "Transit-oriented development", "Industrial zoning", "Highway construction"], correct: 1 },
      { id: 34, question: "What is the urban heat island effect?", options: ["Islands getting hotter", "Cities being warmer than surrounding areas", "A type of air conditioning", "Heating systems in buildings"], correct: 1 },
      { id: 35, question: "What concern is raised about smart city technologies?", options: ["They are too expensive", "Privacy and digital equity", "They don't work", "They require too many workers"], correct: 1 },
      { id: 36, question: "According to the passage, green spaces do NOT:", options: ["Improve air quality", "Support biodiversity", "Increase traffic congestion", "Enhance mental well-being"], correct: 2 },
      { id: 37, question: "What is IoT?", options: ["Internet of Things", "Institute of Technology", "International Organization for Trade", "Index of Transactions"], correct: 0 },
      { id: 38, question: "What does integrated planning consider?", options: ["Only economic factors", "Environmental, social, and economic dimensions", "Only environmental factors", "Only political factors"], correct: 1 },
      { id: 39, question: "Why is community engagement important?", options: ["To increase property values", "To ensure equitable sustainability initiatives", "To reduce government spending", "To attract tourists"], correct: 1 },
      { id: 40, question: "The overall message of the passage is:", options: ["Cities should stop growing", "Sustainable urban development is complex but essential", "Technology solves all urban problems", "Rural living is better"], correct: 1 },
    ],
  },
];

const TOTAL_TIME = 60 * 60; // 60 minutes

const ReadingQuiz = () => {
  const navigate = useNavigate();
  const [currentPassage, setCurrentPassage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 0) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const allQuestions = passages.flatMap((p) => p.questions);
  const totalQ = allQuestions.length;
  const passage = passages[currentPassage];
  const score = submitted ? allQuestions.filter((q) => answers[q.id] === q.correct).length : 0;

  const reset = () => { setAnswers({}); setCurrentPassage(0); setSubmitted(false); setTimeLeft(TOTAL_TIME); };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-border">
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${score >= 30 ? "bg-emerald-100" : score >= 20 ? "bg-amber-100" : "bg-red-100"}`}>
              {score >= 30 ? <CheckCircle2 size={40} className="text-emerald-600" /> : <XCircle size={40} className={score >= 20 ? "text-amber-600" : "text-red-600"} />}
            </div>
            <h2 className="text-2xl font-bold text-foreground">Kết quả Reading</h2>
            <div className="text-5xl font-bold text-foreground">{score}<span className="text-2xl text-muted-foreground">/{totalQ}</span></div>
            <p className="text-muted-foreground">{score >= 30 ? "Xuất sắc!" : score >= 20 ? "Khá tốt!" : "Cần cải thiện thêm."}</p>
            <div className="text-left space-y-2 max-h-60 overflow-y-auto">
              {allQuestions.map((sq, i) => (
                <div key={sq.id} className={`p-2 rounded-lg text-xs ${answers[sq.id] === sq.correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                  <span className="font-medium">Câu {i + 1}: </span>
                  {answers[sq.id] === sq.correct ? <span className="text-emerald-700">✓ {sq.options[sq.correct]}</span> : <span className="text-red-700">✗ Đáp án: {sq.options[sq.correct]}</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quiz")}><ArrowLeft size={16} /> Quay lại</Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={reset}><RotateCcw size={16} /> Làm lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Thoát</button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock size={16} className={timeLeft < 300 ? "text-destructive" : "text-muted-foreground"} />
              <span className={timeLeft < 300 ? "text-destructive" : "text-foreground"}>{formatTime(timeLeft)}</span>
            </div>
            <span className="text-sm text-muted-foreground">Đã trả lời {Object.keys(answers).length}/{totalQ}</span>
          </div>
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={() => setSubmitted(true)}>Nộp bài</Button>
        </div>
        <Progress value={(Object.keys(answers).length / totalQ) * 100} className="h-1" />
      </header>

      {/* Passage tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 flex gap-1 py-2">
          {passages.map((p, i) => (
            <button key={i} onClick={() => setCurrentPassage(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i === currentPassage ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              Bài {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Split screen */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Left: Reading passage */}
        <div className="w-1/2 border-r border-border">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">{passage.title}</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                {passage.content.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed mb-4">{para}</p>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Questions */}
        <div className="w-1/2">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-6 space-y-6">
              <h3 className="font-semibold text-foreground">Câu hỏi – Bài {currentPassage + 1} ({passage.questions.length} câu)</h3>
              {passage.questions.map((q, qi) => {
                const gIdx = passages.slice(0, currentPassage).reduce((s, p) => s + p.questions.length, 0) + qi;
                return (
                  <div key={q.id} className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      <span className="text-primary mr-1">Câu {gIdx + 1}.</span> {q.question}
                    </h4>
                    <RadioGroup value={answers[q.id]?.toString()} onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: parseInt(v) }))} className="space-y-2">
                      {q.options.map((opt, i) => (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${answers[q.id] === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                          <RadioGroupItem value={i.toString()} id={`rq${q.id}-o${i}`} />
                          <Label htmlFor={`rq${q.id}-o${i}`} className="cursor-pointer flex-1 text-foreground">
                            <span className="font-medium text-muted-foreground mr-1">{String.fromCharCode(65 + i)}.</span>{opt}
                          </Label>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ReadingQuiz;
