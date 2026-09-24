import { lazy, Suspense, useEffect, type ReactNode } from "react";
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

// Only the homepage ships in the main bundle. Every other page is its own
// chunk, loaded when it is opened - first-time visitors shouldn't download
// the client portal, the admin panel or the dashboards' chart library.
const NotFound = lazy(() => import("./pages/NotFound"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const CaseStudy = lazy(() => import("./pages/CaseStudy"));
const CaseStudyIndex = lazy(() => import("./pages/CaseStudyIndex"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const Strompreis = lazy(() => import("./pages/Strompreis"));
const RaceStrategy = lazy(() => import("./pages/RaceStrategy"));
const OffTheClock = lazy(() => import("./pages/OffTheClock"));

const queryClient = new QueryClient();

// Suspense sits inside the transition wrapper, so the fade starts straight
// away and the page fills in as soon as its chunk has arrived. The fallback
// is an empty page-height block rather than a spinner: chunks are small and
// usually load within the fade itself.
const LazyPage = ({ children }: { children: ReactNode }) => (
  <PageTransition>
    <Suspense fallback={<div className="min-h-screen bg-background" />}>{children}</Suspense>
  </PageTransition>
);

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
          The homepage is deliberately NOT wrapped in PageTransition (and
          not lazy-loaded). It hosts the GSAP-pinned Experience section,
          which relies on `position: fixed` resolving against the
          viewport. Any wrapper framer-motion animates (and the
          will-change / compositing hints it leaves behind) can re-root
          that, which rendered the pinned section as an empty black area.
          Scroll integrity on the main page beats a fade on it.
        */}
        <Route path="/" element={<Index />} />
        <Route
          path="/work"
          element={
            <LazyPage>
              <CaseStudyIndex />
            </LazyPage>
          }
        />
        <Route
          path="/work/:slug"
          element={
            <LazyPage>
              <CaseStudy />
            </LazyPage>
          }
        />
        <Route
          path="/portal"
          element={
            <LazyPage>
              <ClientPortal />
            </LazyPage>
          }
        />
        <Route
          path="/admin"
          element={
            <LazyPage>
              <AdminPanel />
            </LazyPage>
          }
        />
        <Route
          path="/impressum"
          element={
            <LazyPage>
              <LegalPage page="impressum" />
            </LazyPage>
          }
        />
        <Route
          path="/datenschutz"
          element={
            <LazyPage>
              <LegalPage page="datenschutz" />
            </LazyPage>
          }
        />
        <Route
          path="/strompreis"
          element={
            <LazyPage>
              <Strompreis />
            </LazyPage>
          }
        />
        <Route
          path="/race-strategy"
          element={
            <LazyPage>
              <RaceStrategy />
            </LazyPage>
          }
        />
        <Route
          path="/off-the-clock"
          element={
            <LazyPage>
              <OffTheClock />
            </LazyPage>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route
          path="*"
          element={
            <LazyPage>
              <NotFound />
            </LazyPage>
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
