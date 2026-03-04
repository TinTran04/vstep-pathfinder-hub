import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

// Pages where Lenis should be disabled (they manage their own scrolling)
const noSmoothScrollRoutes = [
  "/quiz/listening/take",
  "/quiz/reading/take",
  "/quiz/writing/take",
  "/quiz/speaking/take",
  "/admin",
];

const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const shouldDisable = noSmoothScrollRoutes.some((r) => location.pathname.startsWith(r));

  useEffect(() => {
    if (shouldDisable) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, [shouldDisable]);

  return <>{children}</>;
};

export default SmoothScroll;
