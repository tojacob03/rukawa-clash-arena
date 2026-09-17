import SiteNav from "@/components/portfolio/SiteNav";
import HeroSection from "@/components/portfolio/HeroSection";
import AboutSection from "@/components/portfolio/AboutSection";
import WorkSection from "@/components/portfolio/WorkSection";
import SkillsSection from "@/components/portfolio/SkillsSection";
import TechStackSection from "@/components/portfolio/TechStackSection";
import TeamHistorySection from "@/components/portfolio/TeamHistorySection";
import AchievementsSection from "@/components/portfolio/AchievementsSection";
import LanguagesSection from "@/components/portfolio/LanguagesSection";
import ContactSection from "@/components/portfolio/ContactSection";
import Footer from "@/components/portfolio/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <HeroSection />
      <AboutSection />
      <WorkSection />
      <SkillsSection />
      <TechStackSection />
      <TeamHistorySection />
      <AchievementsSection />
      <LanguagesSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
