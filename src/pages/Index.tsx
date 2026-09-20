import { useEffect } from "react";
import SiteNav from "@/components/portfolio/SiteNav";
import HeroSection from "@/components/portfolio/HeroSection";
import LiveStats from "@/components/portfolio/LiveStats";
import MetaPulse from "@/components/portfolio/MetaPulse";
import AboutSection from "@/components/portfolio/AboutSection";
import WorkSection from "@/components/portfolio/WorkSection";
import CurrentEngagementsSection from "@/components/portfolio/CurrentEngagementsSection";
import SkillsSection from "@/components/portfolio/SkillsSection";
import TechStackSection from "@/components/portfolio/TechStackSection";
import TechMarquee from "@/components/portfolio/TechMarquee";
import TeamHistorySection from "@/components/portfolio/TeamHistorySection";
import AchievementsSection from "@/components/portfolio/AchievementsSection";
import LanguagesSection from "@/components/portfolio/LanguagesSection";
import ShanghaiRoadmap from "@/components/portfolio/ShanghaiRoadmap";
import ContactSection from "@/components/portfolio/ContactSection";
import Footer from "@/components/portfolio/Footer";

const Index = () => {
  // Handles arriving here as /#section-id (e.g. from SiteNav when the user
  // was on a case study page). document.getElementById only exists once
  // Index has actually mounted, so this can't be done from the link itself.
  // The extra delay gives layout-affecting effects (GSAP pin spacers in
  // TeamHistorySection, etc.) a moment to settle before we measure position.
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <HeroSection />
      <LiveStats />
      <MetaPulse />
      <AboutSection />
      <WorkSection />
      <CurrentEngagementsSection />
      <SkillsSection />
      <TechStackSection />
      <TechMarquee />
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
