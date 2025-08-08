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

const ServicesSection = () => {
  const { t } = useTranslation();
  
  const services = [
    {
      title: t('services.teamAnalysis.title', 'Team Analysis'),
      description: t('services.teamAnalysis.description', 'Professional team analysis and strategic planning.'),
      icon: User,
      features: [
        t('services.teamAnalysis.feature1', 'Player Performance Analysis'),
        t('services.teamAnalysis.feature2', 'Deck Optimization'),
        t('services.teamAnalysis.feature3', 'Match History Review')
      ]
    },
    {
      title: t('services.opponentScouting.title', 'Opponent Scouting'),
      description: t('services.opponentScouting.description', 'Advanced opponent research and counter-strategy development.'),
      icon: Shield,
      features: [
        t('services.opponentScouting.feature1', 'Opponent Research'),
        t('services.opponentScouting.feature2', 'Strategic Planning'),
        t('services.opponentScouting.feature3', 'Match Preparation')
      ]
    },
    {
      title: t('services.personalCoaching.title', 'Personal Coaching'),
      description: t('services.personalCoaching.description', 'One-on-one coaching sessions for competitive improvement.'),
      icon: TrendingUp,
      features: [
        t('services.personalCoaching.feature1', 'Individual Training'),
        t('services.personalCoaching.feature2', 'Strategy Development'),
        t('services.personalCoaching.feature3', 'Performance Tracking')
      ]
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
            {t('services.title', 'Coaching & Services')}
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
            {t('services.subtitle', 'Professional coaching and analytical services tailored for competitive Clash Royale players and teams.')}
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
                {t('services.learnMore', 'Learn More')}
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