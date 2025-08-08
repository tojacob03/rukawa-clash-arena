import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '@/i18n';

interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { i18n } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // If no language in URL, detect and redirect
    if (!lang) {
      const detectedLanguage = i18n.language.split('-')[0];
      const targetLanguage = supportedLanguages.includes(detectedLanguage) 
        ? detectedLanguage 
        : 'en';
      navigate(`/${targetLanguage}${window.location.pathname}`, { replace: true });
      return;
    }

    // If language is not supported, redirect to English
    if (!supportedLanguages.includes(lang)) {
      navigate('/en' + window.location.pathname.substring(3), { replace: true });
      return;
    }

    // Change language if different from current
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }

    // Update document attributes for RTL support
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang, i18n, navigate]);

  return <>{children}</>;
};

export default LanguageProvider;