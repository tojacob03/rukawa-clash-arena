import SiteNav from "@/components/portfolio/SiteNav";
import HeroSection from "@/components/portfolio/HeroSection";
import MacbookScrollHero from "@/components/portfolio/MacbookScrollHero";
import LiveStats from "@/components/portfolio/LiveStats";
import MetaPulse from "@/components/portfolio/MetaPulse";
import AboutSection from "@/components/portfolio/AboutSection";
import WorkSection from "@/components/portfolio/WorkSection";
import CurrentEngagementsSection from "@/components/portfolio/CurrentEngagementsSection";
import SkillsSection from "@/components/portfolio/SkillsSection";
import TechStackSection from "@/components/portfolio/TechStackSection";
import TeamHistorySection from "@/components/portfolio/TeamHistorySection";
import AchievementsSection from "@/components/portfolio/AchievementsSection";
import LanguagesSection from "@/components/portfolio/LanguagesSection";
import ShanghaiRoadmap from "@/components/portfolio/ShanghaiRoadmap";
import ContactSection from "@/components/portfolio/ContactSection";
import Footer from "@/components/portfolio/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <HeroSection />
      <MacbookScrollHero />
      <LiveStats />
      <MetaPulse />
      <AboutSection />
      <WorkSection />
      <CurrentEngagementsSection />
      <SkillsSection />
      <TechStackSection />
      <TeamHistorySection />
      <AchievementsSection />
      <LanguagesSection />
      <ShanghaiRoadmap />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
