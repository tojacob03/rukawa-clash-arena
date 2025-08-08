import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const languages = [
  {
    name: "German",
    level: "Native",
    flag: "🇩🇪",
    proficiency: 100
  },
  {
    name: "English",
    level: "C2",
    flag: "🇺🇸",
    proficiency: 95
  },
  {
    name: "Spanish",
    level: "B1",
    flag: "🇪🇸",
    proficiency: 65
  },
  {
    name: "Russian",
    level: "A2",
    flag: "🇷🇺",
    proficiency: 40
  },
  {
    name: "Arabic",
    level: "A2",
    flag: "🇸🇦",
    proficiency: 40
  }
];

const LanguagesSection = () => {
  const { t } = useTranslation();
  
  const languages = [
    {
      name: t('languages.de.name'),
      level: t('languages.de.level'),
      flag: "🇩🇪",
      proficiency: 100
    },
    {
      name: t('languages.en.name'),
      level: t('languages.en.level'),
      flag: "🇺🇸", 
      proficiency: 95
    },
    {
      name: t('languages.es.name'),
      level: t('languages.es.level'),
      flag: "🇪🇸",
      proficiency: 65
    },
    {
      name: t('languages.ru.name'),
      level: t('languages.ru.level'),
      flag: "🇷🇺",
      proficiency: 40
    },
    {
      name: t('languages.ar.name'),
      level: t('languages.ar.level'),
      flag: "🇸🇦",
      proficiency: 40
    }
  ];

  return (
    <section id="languages" className="py-20 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            {t('languages.title')}
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((language, index) => (
            <Card 
              key={language.name}
              className="gradient-card shadow-card border-border/50 p-6 hover:shadow-glow transition-all duration-300 group text-center"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-4xl mb-4">{language.flag}</div>
              <h3 className="text-xl font-bold text-foreground mb-2">{language.name}</h3>
              <p className="text-clash-gold font-semibold mb-4">{language.level}</p>
              
              {/* Proficiency Bar */}
              <div className="w-full bg-secondary rounded-full h-2 mb-2">
                <div 
                  className="gradient-primary h-2 rounded-full transition-all duration-1000 group-hover:animate-glow"
                  style={{ width: `${language.proficiency}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground">{language.proficiency}%</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LanguagesSection;