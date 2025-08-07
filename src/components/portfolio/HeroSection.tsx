import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Trophy, BarChart3 } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import PDFViewer from "./PDFViewer";

const HeroSection = () => {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openPDFViewer = (title: string) => {
    setPdfTitle(title);
    setPdfViewerOpen(true);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float">
        <Trophy className="w-8 h-8 text-clash-gold opacity-30" />
      </div>
      <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '1s' }}>
        <BarChart3 className="w-10 h-10 text-primary opacity-40" />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="animate-slide-in-up">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            Rukawa
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Data-driven Clash Royale Analyst & Coach with international tournament experience
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => openPDFViewer("Portfolio & Analysis Samples")}
              className="group"
            >
              View My Work
              <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => scrollToSection('contact')}
            >
              Get In Touch
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-3xl font-bold text-clash-gold mb-2">5+</div>
            <div className="text-muted-foreground">Years Experience</div>
          </div>
          <div className="text-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-3xl font-bold text-clash-gold mb-2">Top 9-12</div>
            <div className="text-muted-foreground">CRL Monthly Finals</div>
          </div>
          <div className="text-center animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="text-3xl font-bold text-clash-gold mb-2">Top 6</div>
            <div className="text-muted-foreground">Copa América Finish</div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </div>

      {/* PDF Viewer */}
      <PDFViewer
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        title={pdfTitle}
        showSelection={true}
      />
    </section>
  );
};

export default HeroSection;