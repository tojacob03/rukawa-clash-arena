import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PageTransition from "@/components/PageTransition";
import SmoothScroll from "@/components/SmoothScroll";
import { resetScroll } from "@/lib/smoothScroll";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClientPortal from "./pages/ClientPortal";
import AdminPanel from "./pages/AdminPanel";
import CaseStudy from "./pages/CaseStudy";
import CaseStudyIndex from "./pages/CaseStudyIndex";
import LegalPage from "./pages/LegalPage";
import Strompreis from "./pages/Strompreis";
import RaceStrategy from "./pages/RaceStrategy";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    // Land at the top of a newly opened page - but never fight Index's own
    // hash-scroll (e.g. arriving at /#contact from a case study). Goes
    // through Lenis, otherwise Lenis would keep interpolating toward the
    // previous page's scroll position.
    if (!location.hash) {
      resetScroll();
    }

    // Pinned GSAP sections measure page height on creation. After a route
    // swap the document height has changed, so their trigger positions are
    // stale until refreshed.
    const timer = setTimeout(() => ScrollTrigger.refresh(), 320);
    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    // mode="wait" keeps the outgoing page mounted until its exit finishes,
    // so the two pages never overlap mid-transition.
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/*
          The homepage is deliberately NOT wrapped in PageTransition.
          It hosts the sticky MacbookScroll and the GSAP-pinned
          Experience section, both of which rely on `position: fixed` /
          `position: sticky` resolving against the viewport. Any wrapper
          framer-motion animates (and the will-change / compositing hints
          it leaves behind) can re-root those, which rendered the pinned
          section as an empty black area. Scroll integrity on the main
          page beats a fade on it.
        */}
        <Route path="/" element={<Index />} />
        <Route
          path="/work"
          element={
            <PageTransition>
              <CaseStudyIndex />
            </PageTransition>
          }
        />
        <Route
          path="/work/:slug"
          element={
            <PageTransition>
              <CaseStudy />
            </PageTransition>
          }
        />
        <Route
          path="/portal"
          element={
            <PageTransition>
              <ClientPortal />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <AdminPanel />
            </PageTransition>
          }
        />
        <Route
          path="/impressum"
          element={
            <PageTransition>
              <LegalPage page="impressum" />
            </PageTransition>
          }
        />
        <Route
          path="/datenschutz"
          element={
            <PageTransition>
              <LegalPage page="datenschutz" />
            </PageTransition>
          }
        />
        <Route
          path="/strompreis"
          element={
            <PageTransition>
              <Strompreis />
            </PageTransition>
          }
        />
        <Route
          path="/race-strategy"
          element={
            <PageTransition>
              <RaceStrategy />
            </PageTransition>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SmoothScroll />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
