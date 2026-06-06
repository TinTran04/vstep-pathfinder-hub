import Navbar from "@/components/Navbar";
import HeroSection from "@/features/landing/components/HeroSection";
import VstepOverview from "@/features/landing/components/VstepOverview";
import BenefitsSection from "@/features/landing/components/BenefitsSection";
import SkillsSection from "@/features/landing/components/SkillsSection";
import LearningJourney from "@/features/landing/components/LearningJourney";
import ExamSection from "@/features/landing/components/ExamSection";
import DashboardSection from "@/features/landing/components/DashboardSection";
import TestimonialSection from "@/features/landing/components/TestimonialSection";
import PricingSection from "@/features/landing/components/PricingSection";
import FooterSection from "@/features/landing/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <VstepOverview />
      <BenefitsSection />
      <SkillsSection />
      <LearningJourney />
      <ExamSection />
      <DashboardSection />
      <TestimonialSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
};

export default Index;
