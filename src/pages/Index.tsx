import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToSection } from "@/lib/smoothScroll";
import SiteNav from "@/components/portfolio/SiteNav";
import KineticHero from "@/components/portfolio/KineticHero";
import MetaPulse from "@/components/portfolio/MetaPulse";
import SystemStory from "@/components/portfolio/SystemStory";
import ApproachSection from "@/components/portfolio/ApproachSection";
import SideProjectSection from "@/components/portfolio/SideProjectSection";
import TeamHistorySection from "@/components/portfolio/TeamHistorySection";
import AchievementsSection from "@/components/portfolio/AchievementsSection";
import ShanghaiRoadmap from "@/components/portfolio/ShanghaiRoadmap";
import ContactSection from "@/components/portfolio/ContactSection";
import Footer from "@/components/portfolio/Footer";

const Index = () => {
  // Handles arriving here as /#section-id (e.g. from SiteNav on a case study
  // page). The section only exists once Index has mounted.
  //
  // Order matters: the GSAP pin spacer in TeamHistorySection adds page
  // height, which shifts every section below it (Contact included). So
  // refresh ScrollTrigger FIRST, then measure and scroll - otherwise the
  // jump lands on a stale position computed before the spacer existed.
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
      scrollToSection(hash);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <KineticHero />
      <MetaPulse />
      <SystemStory />
      <ApproachSection />
      <SideProjectSection />
      <TeamHistorySection />
      <AchievementsSection />
      <ShanghaiRoadmap />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
