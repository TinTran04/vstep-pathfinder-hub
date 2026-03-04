import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";
import PageTransition from "./components/PageTransition";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";

import ListeningQuiz from "./pages/ListeningQuiz";
import ReadingQuiz from "./pages/ReadingQuiz";
import WritingQuiz from "./pages/WritingQuiz";
import SpeakingQuiz from "./pages/SpeakingQuiz";
import VstepRegistration from "./pages/VstepRegistration";
import Admin from "./pages/Admin";
import Results from "./pages/Results";
import WritingSamples from "./pages/WritingSamples";
import NotFound from "./pages/NotFound";

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
