import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { 
  FileSpreadsheet, 
  Search, 
  Layers, 
  TrendingUp, 
  FolderOpen, 
  BarChart3 
} from "lucide-react";

const skills = [
  {
    name: "Excel Proficiency",
    icon: FileSpreadsheet,
    description: "Advanced data analysis and visualization"
  },
  {
    name: "Opponent Research",
    icon: Search,
    description: "Deep dive analysis of competitor strategies"
  },
  {
    name: "Duel Set Crafting",
    icon: Layers,
    description: "Strategic deck building for tournaments"
  },
  {
    name: "Meta Awareness",
    icon: TrendingUp,
    description: "Current meta trends and predictions"
  },
  {
    name: "Organization",
    icon: FolderOpen,
    description: "Structured data management systems"
  },
  {
    name: "Visual Data Presentation",
    icon: BarChart3,
    description: "Clear and actionable insights delivery"
  }
];

const SkillsSection = () => {
  const { t } = useTranslation();
  
  const skills = [
    {
      name: t('skills.strategicAnalysis.name'),
      icon: FileSpreadsheet,
      description: t('skills.strategicAnalysis.description')
    },
    {
      name: t('skills.opponentScouting.name'),
      icon: Search,
      description: t('skills.opponentScouting.description')
    },
    {
      name: t('skills.performanceTracking.name'),
      icon: Layers,
      description: t('skills.performanceTracking.description')
    },
    {
      name: t('skills.coaching.name'),
      icon: TrendingUp,
      description: t('skills.coaching.description')
    }
  ];

  return (
    <section id="skills" className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            {t('skills.title')}
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((skill, index) => (
            <Card 
              key={skill.name}
              className="gradient-card shadow-card border-border/50 p-6 hover:shadow-glow transition-all duration-300 group hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 gradient-primary rounded-lg shadow-glow group-hover:animate-glow">
                  <skill.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{skill.name}</h3>
              </div>
              <p className="text-muted-foreground">{skill.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;