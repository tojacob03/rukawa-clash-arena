import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { 
  User, 
  Shield, 
  TrendingUp, 
  FileText,
  ArrowRight
} from "lucide-react";

const services = [
  {
    title: "Individual Analysis",
    description: "Personalized analysis and deck picking for competitive players looking to improve their tournament performance.",
    icon: User,
    features: ["Player Performance Analysis", "Deck Optimization", "Match History Review"]
  },
  {
    title: "CRL-Level Prep",
    description: "Professional tournament preparation including opponent scouting and strategic planning for high-level competition.",
    icon: Shield,
    features: ["Opponent Research", "Strategic Planning", "Match Preparation"]
  },
  {
    title: "Meta Analysis",
    description: "Comprehensive meta overviews and duel deck crafting to stay ahead of the competition.",
    icon: TrendingUp,
    features: ["Meta Reports", "Deck Building", "Trend Analysis"]
  },
  {
    title: "Analysis Tools",
    description: "Custom cheat sheets and analysis tools designed to give teams a competitive edge in tournaments.",
    icon: FileText,
    features: ["Custom Cheat Sheets", "Data Visualization", "Strategic Tools"]
  }
];

const ServicesSection = () => {
  const { t } = useTranslation();
  
  const services = [
    {
      title: t('services.teamAnalysis.title'),
      description: t('services.teamAnalysis.description'),
      icon: User,
      features: t('services.teamAnalysis.features', { returnObjects: true }) as string[]
    },
    {
      title: t('services.opponentScouting.title'),
      description: t('services.opponentScouting.description'),
      icon: Shield,
      features: t('services.opponentScouting.features', { returnObjects: true }) as string[]
    },
    {
      title: t('services.personalCoaching.title'),
      description: t('services.personalCoaching.description'),
      icon: TrendingUp,
      features: t('services.personalCoaching.features', { returnObjects: true }) as string[]
    }
  ];
  
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="services" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            {t('services.title')}
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="gradient-card shadow-card border-border/50 p-8 hover:shadow-glow transition-all duration-300 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-4 gradient-primary rounded-xl shadow-glow group-hover:animate-glow">
                  <service.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                {service.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-clash-gold"></div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full group-hover:border-primary group-hover:text-primary"
                onClick={scrollToContact}
              >
                {t('services.learnMore')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;