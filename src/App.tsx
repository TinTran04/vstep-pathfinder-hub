import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";
import PageTransition from "./components/PageTransition";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import Index from "@/features/landing/pages/Index";
import Auth from "@/features/auth/pages/Auth";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import Quiz from "@/features/quiz/pages/Quiz";

import ListeningQuiz from "@/features/quiz/listening/pages/ListeningQuiz";
import ReadingQuiz from "@/features/quiz/reading/pages/ReadingQuiz";
import WritingQuiz from "@/features/quiz/writing/pages/WritingQuiz";
import SpeakingQuiz from "@/features/quiz/speaking/pages/SpeakingQuiz";
import VstepRegistration from "@/features/registration/pages/VstepRegistration";
import Admin from "@/features/admin/pages/Admin";
import Results from "@/features/quiz/pages/Results";
import WritingSamples from "@/features/quiz/writing/pages/WritingSamples";
import MockTestLanding from "@/features/attempts/pages/MockTestLanding";
import AttemptReview from "@/features/attempts/pages/AttemptReview";
import AttemptResult from "@/features/attempts/pages/AttemptResult";
import MockTestReviewRedirect from "@/features/attempts/components/MockTestReviewRedirect";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/quiz" element={<PageTransition><Quiz /></PageTransition>} />
        
        <Route path="/quiz/listening/take" element={<PageTransition><ListeningQuiz /></PageTransition>} />
        <Route path="/quiz/reading/take" element={<PageTransition><ReadingQuiz /></PageTransition>} />
        <Route path="/quiz/writing/take" element={<PageTransition><WritingQuiz /></PageTransition>} />
        <Route path="/quiz/speaking/take" element={<PageTransition><SpeakingQuiz /></PageTransition>} />
        <Route path="/vstep-registration" element={<PageTransition><VstepRegistration /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="/results" element={<PageTransition><Results /></PageTransition>} />
        <Route path="/writing-samples" element={<PageTransition><WritingSamples /></PageTransition>} />
        <Route path="/mock-test" element={<PageTransition><MockTestLanding /></PageTransition>} />
        <Route path="/attempts/:attemptId/result" element={<PageTransition><AttemptResult /></PageTransition>} />
        <Route path="/attempts/:attemptId/review" element={<PageTransition><AttemptReview /></PageTransition>} />
        <Route path="/mock-test/review" element={<PageTransition><MockTestReviewRedirect /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SmoothScroll>
            <AnimatedRoutes />
          </SmoothScroll>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
