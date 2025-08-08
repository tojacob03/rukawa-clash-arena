import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supportedLanguages } from '@/i18n';

const languageNames = {
  de: { name: '🇩🇪 Deutsch', native: 'Deutsch' },
  en: { name: '🇺🇸 English', native: 'English' },
  es: { name: '🇪🇸 Español', native: 'Español' },
  fr: { name: '🇫🇷 Français', native: 'Français' },
  pt: { name: '🇧🇷 Português', native: 'Português' },
  ar: { name: '🇸🇦 العربية', native: 'العربية' },
  ru: { name: '🇷🇺 Русский', native: 'Русский' },
  ja: { name: '🇯🇵 日本語', native: '日本語' },
};

const LanguageSwitcher = () => {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLanguageChange = (newLang: string) => {
    const currentPath = window.location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/[a-z]{2}/, '');
    navigate(`/${newLang}${pathWithoutLang || '/'}`);
  };

  const currentLang = lang || 'en';

  return (
    <Select value={currentLang} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-40 bg-secondary/50 border-border/50">
        <SelectValue>
          {languageNames[currentLang as keyof typeof languageNames]?.name || '🇺🇸 English'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-secondary border-border/50 z-50">
        {supportedLanguages.map((language) => (
          <SelectItem 
            key={language} 
            value={language}
            className="hover:bg-secondary/80 focus:bg-secondary/80"
          >
            {languageNames[language as keyof typeof languageNames]?.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher;