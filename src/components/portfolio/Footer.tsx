import { Mail, MessageCircle, Twitter, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-6 bg-secondary/30 border-t border-border/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
            <div className="p-2 gradient-primary rounded-lg shadow-glow">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">{t('footer.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('footer.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-6 md:mb-0">
            <a 
              href="mailto:to_jacob@me.com"
              className="p-3 rounded-lg bg-secondary/50 text-clash-blue hover:bg-secondary transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a 
              href="#"
              className="p-3 rounded-lg bg-secondary/50 text-clash-purple hover:bg-secondary transition-colors"
              aria-label="Discord"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a 
              href="https://twitter.com/RukawaAnalyst"
              className="p-3 rounded-lg bg-secondary/50 text-clash-gold hover:bg-secondary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Rukawa. {t('footer.copyright')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('footer.tagline')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;