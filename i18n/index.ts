// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en';
import es from '../locales/es';
import de from '../locales/de';
import fr from '../locales/fr';
import it from '../locales/it';
import ja from '../locales/ja';
import ko from '../locales/ko';
import pt from '../locales/pt';
import zh from '../locales/zh';
// import other languages

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
      it: { translation: it },
      ja: { translation: ja },
      ko: { translation: ko },
      pt: { translation: pt },
      zh: { translation: zh },
      // other languages
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;