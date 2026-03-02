import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import VstepOverview from "@/components/VstepOverview";
import BenefitsSection from "@/components/BenefitsSection";
import SkillsSection from "@/components/SkillsSection";
import LearningJourney from "@/components/LearningJourney";
import ExamSection from "@/components/ExamSection";
import DashboardSection from "@/components/DashboardSection";
import TestimonialSection from "@/components/TestimonialSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import FooterSection from "@/components/FooterSection";

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
      <CTASection />
      <FooterSection />
    </div>
  );
};

export default Index;
