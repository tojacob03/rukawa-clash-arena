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
import playerAnalysisScreenshot from "@/assets/Image 19.09.26 at 18.45.jpeg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <HeroSection />

      <MacbookScrollHero
        title={
          <>
            <p className="text-xs uppercase tracking-[0.22em] text-clash-gold">Player Analysis Tooling</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">The interface behind the numbers below</h2>
          </>
        }
      >
        <img
          src={playerAnalysisScreenshot}
          alt="Player analysis dashboard screenshot"
          loading="eager"
          decoding="async"
          className="block h-full w-full object-contain object-center"
        />
      </MacbookScrollHero>

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
