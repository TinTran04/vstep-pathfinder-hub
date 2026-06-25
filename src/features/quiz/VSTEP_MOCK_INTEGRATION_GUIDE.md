// INTEGRATION GUIDE: VstepMockLayout Integration for Quiz Components
// =============================================================================
// This guide shows how to integrate VstepMockLayout into each of the 4 quiz pages.
// Apply these changes to: ListeningQuiz.tsx, ReadingQuiz.tsx, WritingQuiz.tsx, SpeakingQuiz.tsx

// STEP 1: Add imports at the top of the file
// ─────────────────────────────────────────────────────────────────────────
import { VstepMockLayout } from "@/features/quiz/components/VstepMockLayout";
import { ExitConfirmDialog } from "@/features/quiz/components/ExitConfirmDialog";
import { attemptsApiService } from "@/features/attempts/services/attempts.api-service";
import { useNavigate } from "react-router-dom";

// STEP 2: In the component state, add this
// ─────────────────────────────────────────────────────────────────────────
const [attemptId, setAttemptId] = useState<number | null>(null);
const [serverTimeRemaining, setServerTimeRemaining] = useState<number>(0);
const navigate = useNavigate();

// STEP 3: When loading the exam/starting practice, capture attemptId
// ─────────────────────────────────────────────────────────────────────────
// In the useEffect where you call listeningService.start():
useEffect(() => {
  const loadExam = async () => {
    try {
      const res = await listeningService.start(Number(examId));
      setPracticeData(res);
      setAttemptId(res.attemptId); // CAPTURE THIS
      setLoading(false);
    } catch (error) {
      setStartError((error as Error).message);
      setLoading(false);
    }
  };
  loadExam();
}, [examId]);

// STEP 4: Add state to track remaining time from backend
// ─────────────────────────────────────────────────────────────────────────
// Update your timer logic to fetch expiresAt from backend every second:
useEffect(() => {
  if (submitted || !isMockSession || !attemptId) return;

  const interval = setInterval(async () => {
    try {
      const progress = await attemptsApiService.getInProgressAttempt();
      if (progress && progress.remainingSeconds !== undefined) {
        setServerTimeRemaining(Math.max(0, progress.remainingSeconds));
        if (progress.remainingSeconds <= 0) {
          handleAutoSubmit();
        }
      }
    } catch (error) {
      console.error("Failed to fetch remaining time:", error);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [submitted, isMockSession, attemptId]);

// STEP 5: Add autosave function for mock test
// ─────────────────────────────────────────────────────────────────────────
const handleAutosave = async () => {
  if (!isMockSession || !attemptId || Object.keys(answers).length === 0) return;

  try {
    const draftState = JSON.stringify({
      _meta: { mode: "mock_test", currentSkill: "listening" },
      answers: answers,
      sectionIndex: currentSection,
    });
    await attemptsApiService.autosaveMockTest(String(attemptId), "listening", draftState);
  } catch (error) {
    console.error("Autosave failed:", error);
  }
};

// Call autosave every 5 seconds
useEffect(() => {
  if (isMockSession && attemptId) {
    const interval = setInterval(handleAutosave, 5000);
    return () => clearInterval(interval);
  }
}, [isMockSession, attemptId, answers, currentSection]);

// STEP 6: Add handler for exiting mock test
// ─────────────────────────────────────────────────────────────────────────
const handleExitMockTest = () => {
  // attemptsApiService.deleteAttempt will be called by ExitConfirmDialog
  // After deletion, redirect
  navigate("/quiz");
};

// STEP 7: Calculate question statuses for grid
// ─────────────────────────────────────────────────────────────────────────
const getQuestionStatuses = (): Record<number, "answered" | "unanswered"> => {
  const statuses: Record<number, "answered" | "unanswered"> = {};
  let questionNumber = 1;
  
  practiceData?.exam.sections.forEach((section) => {
    section.questions.forEach(() => {
      const allQId = Object.keys(answers).find(
        (qId) => answers[qId] !== undefined
      );
      statuses[questionNumber] = allQId ? "answered" : "unanswered";
      questionNumber++;
    });
  });
  
  return statuses;
};

// STEP 8: Wrap the main content JSX
// ─────────────────────────────────────────────────────────────────────────
// In your return statement:

if (isMockSession && practiceData && attemptId) {
  return (
    <VstepMockLayout
      skillName="Listening / Kỹ năng Nghe"
      remainingSeconds={serverTimeRemaining}
      questionCount={countAllQuestions(practiceData.exam.sections)}
      answeredCount={Object.keys(answers).length}
      currentQuestion={undefined} // Optional: update based on scroll position
      isLastSkill={false} // Set to true for Speaking
      onExit={() => handleExitMockTest()}
      onNext={() => handleSubmitAndAdvance()} // For advancing to next skill
      onQuestionSelect={(questionNum) => {
        // Scroll to question
        questionsScrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }}
      questionStatuses={getQuestionStatuses()}
      attemptId={attemptId}
    >
      {/* Paste your existing quiz content here */}
      {/* The entire main div from line 475-584 goes here */}
      {/* Keep all the existing section tabs, audio player, questions, etc. */}
    </VstepMockLayout>
  );
} else {
  // Return original non-mock layout for practice mode
  return (
    // Your existing JSX structure for practice mode
  );
}

// STEP 9: Update submit handler for mock test
// ─────────────────────────────────────────────────────────────────────────
const handleSubmitAndAdvance = async () => {
  if (!isMockSession || !attemptId) {
    handleSubmit(); // Existing submit for practice mode
    return;
  }

  try {
    setSubmitting(true);
    const draftState = JSON.stringify({
      _meta: { mode: "mock_test", currentSkill: "listening" },
      answers: answers,
    });

    // Autosave final state
    await attemptsApiService.autosaveMockTest(String(attemptId), "listening", draftState);

    // Auto-advance to Reading (or next skill)
    // Navigate with the same attemptId so Reading can load the same attempt
    navigate(`/quiz/reading/take?attemptId=${attemptId}&mode=mock_test&session=mock`);
  } catch (error) {
    toast.error("Lỗi: " + (error as Error).message);
    setSubmitting(false);
  }
};

// STEP 10: For ListeningQuiz, also update the auto-submit handler
// ─────────────────────────────────────────────────────────────────────────
const handleAutoSubmit = async () => {
  if (!isMockSession || !attemptId) return;

  try {
    await handleSubmitAndAdvance();
  } catch (error) {
    console.error("Auto-submit failed:", error);
  }
};

// ═════════════════════════════════════════════════════════════════════════
// APPLY SIMILAR PATTERN TO OTHER QUIZ FILES:
// ═════════════════════════════════════════════════════════════════════════
// 
// ReadingQuiz.tsx:
// - Same imports and state setup
// - skillName = "Reading / Kỹ năng Đọc"
// - questionCount depends on passages (4 passages x 10 = 40 questions)
// - handleSubmitAndAdvance navigates to `/quiz/writing/take?...`
// 
// WritingQuiz.tsx:
// - Same imports and state setup
// - skillName = "Writing / Kỹ năng Viết"
// - questionCount = 2 (Task 1, Task 2)
// - onNext handler saves draft and navigates to `/quiz/speaking/take?...`
// 
// SpeakingQuiz.tsx:
// - Same imports and state setup
// - skillName = "Speaking / Kỹ năng Nói"
// - questionCount = 3 (Part 1, 2, 3)
// - isLastSkill = true
// - onNext handler submits entire mock test and navigates to `/attempts/{id}/result`
//   using: `navigate(`/attempts/${attemptId}/result`);`
