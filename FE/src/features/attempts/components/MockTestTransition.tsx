import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attemptsService } from "../services/attempts.service";

interface Props {
  completedSkillLabel: string;
  nextSkillLabel: string;
  nextRoute: string;
}

const MockTestTransition = ({ completedSkillLabel, nextSkillLabel, nextRoute }: Props) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const hasNavigated = useRef(false);
  const isFinished = nextRoute.includes("/mock-test/review") || nextRoute.includes("/result");

  const resolvedRouteRef = useRef<string | null>(null);

  // Pre-resolve the navigation target asynchronously so it's ready when needed
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const groupId = searchParams.get("groupId");

    if (nextRoute.includes("/mock-test/review")) {
      (async () => {
        const current =
          (await attemptsService.getCurrentAttempt()) ??
          (await attemptsService.getLastAttempt());
        resolvedRouteRef.current = current
          ? `/attempts/${current.id}/result`
          : "/quiz";
      })();
    } else {
      if (groupId) {
        resolvedRouteRef.current = `${nextRoute}${nextRoute.includes("?") ? "&" : "?"}groupId=${groupId}`;
      } else {
        resolvedRouteRef.current = nextRoute;
      }
    }
  }, [nextRoute]);

  const handleNavigate = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigate(resolvedRouteRef.current ?? nextRoute);
  }, [navigate, nextRoute]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          handleNavigate();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleNavigate]);

  const circumference = 2 * Math.PI * 28; // r=28

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Icon */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${isFinished ? "bg-primary/10" : "bg-emerald-100"}`}>
          {isFinished ? (
            <Flag size={44} className="text-primary" />
          ) : (
            <CheckCircle2 size={44} className="text-emerald-600" />
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Bạn vừa hoàn thành{" "}
            <span className="text-primary">{completedSkillLabel}</span>.
          </h2>
          {!isFinished ? (
            <>
              <p className="text-lg text-muted-foreground">
                Tiếp theo:{" "}
                <span className="font-semibold text-foreground">{nextSkillLabel}</span>.
              </p>
              <p className="text-muted-foreground">
                Bài thi sẽ tiếp tục sau{" "}
                <span className="font-bold text-foreground">{countdown}</span> giây...
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              Đang chuyển đến trang kết quả sau{" "}
              <span className="font-bold text-foreground">{countdown}</span> giây...
            </p>
          )}
        </div>

        {/* Countdown ring */}
        <div className="w-20 h-20 mx-auto relative">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="4"
            />
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(countdown / 5) * circumference} ${circumference}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
            {countdown}
          </span>
        </div>

        {/* Action Button */}
        <div>
          <Button
            className="gradient-primary text-primary-foreground font-semibold px-6 shadow-md hover:shadow-lg transition-all"
            onClick={handleNavigate}
          >
            Tiếp tục ngay
          </Button>
        </div>

        {/* Next label */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ArrowRight size={16} className="text-primary" />
          {isFinished ? "Xem kết quả tổng hợp" : `Bắt đầu ${nextSkillLabel}`}
        </div>

        {/* Mode badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          Thi thử đang diễn ra — Không được thoát
        </div>
      </div>
    </div>
  );
};

export default MockTestTransition;
