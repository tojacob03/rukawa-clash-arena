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

      <MacbookScrollHero
        title={
          <>
            <p className="text-xs uppercase tracking-[0.22em] text-clash-gold">Player Analysis Tooling</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">The interface behind the numbers below</h2>
          </>
        }
      >
        <div className="flex h-full w-full flex-col p-4 font-mono text-xs sm:p-6 sm:text-sm">
          <div className="mb-4 flex items-center justify-between text-muted-foreground">
            <span>PLAYER ANALYSIS</span>
            <span className="text-clash-gold">INTERNAL</span>
          </div>
          <div className="mb-4 rounded-md border border-border/40 bg-secondary/30 p-3">
            <div className="text-[10px] text-muted-foreground">Player tag</div>
            <div className="mt-1 tracking-widest text-foreground">#········</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-secondary/40 p-3">
              <strong className="block text-lg">1</strong>
              <span className="text-[10px] text-muted-foreground">Profile</span>
            </div>
            <div className="rounded-md bg-secondary/40 p-3">
              <strong className="block text-lg text-clash-gold">214</strong>
              <span className="text-[10px] text-muted-foreground">Battles</span>
            </div>
            <div className="rounded-md bg-secondary/40 p-3">
              <strong className="block text-lg text-clash-blue">12</strong>
              <span className="text-[10px] text-muted-foreground">Duels</span>
            </div>
          </div>
          <div className="mt-4 flex-1 space-y-2">
            {[
              ["Cycle A", "1.00"],
              ["Beatdown B", "0.81"],
              ["Control C", "0.62"],
            ].map(([deck, score], i) => (
              <div key={deck} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{deck}</span>
                <span className={i === 0 ? "text-clash-gold" : "text-muted-foreground"}>{score}</span>
              </div>
            ))}
          </div>
        </div>
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
