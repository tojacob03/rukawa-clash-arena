import SiteNav from "@/components/portfolio/SiteNav";
import HeroSection from "@/components/portfolio/HeroSection";
import MacbookScroll from "@/components/ui/macbook-scroll";
import analysisPreview from "@/assets/Image 19.09.26 at 18.45.jpeg";
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

      <section className="overflow-hidden bg-background px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <MacbookScroll
            title={
              <span>
                From battle logs to better decisions.
                <br />
                The analysis workspace in motion.
              </span>
            }
            src={analysisPreview}
            alt="Rukawa player analysis workspace"
            showGradient
          />
        </div>
      </section>

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
