import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./auth";

type Language = "kz" | "ru" | "en";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const dictionary: Record<Language, Record<string, string>> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.tasks": "Tasks",
    "nav.create_task": "Create Task",
    "nav.volunteers": "Volunteers",
    "nav.chat": "AI Assistant",
    "nav.admin": "Admin",
    "nav.profile": "Profile",
    "nav.logout": "Logout",
    "nav.login": "Login",
    "nav.register": "Register",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
  },
  ru: {
    "nav.dashboard": "Панель управления",
    "nav.tasks": "Задачи",
    "nav.create_task": "Создать задачу",
    "nav.volunteers": "Волонтеры",
    "nav.chat": "ИИ Ассистент",
    "nav.admin": "Админ",
    "nav.profile": "Профиль",
    "nav.logout": "Выйти",
    "nav.login": "Войти",
    "nav.register": "Регистрация",
    "common.loading": "Загрузка...",
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
  },
  kz: {
    "nav.dashboard": "Басқару тақтасы",
    "nav.tasks": "Тапсырмалар",
    "nav.create_task": "Тапсырма құру",
    "nav.volunteers": "Еріктілер",
    "nav.chat": "ЖИ Көмекшісі",
    "nav.admin": "Әкімші",
    "nav.profile": "Профиль",
    "nav.logout": "Шығу",
    "nav.login": "Кіру",
    "nav.register": "Тіркелу",
    "common.loading": "Жүктелуде...",
    "common.save": "Сақтау",
    "common.cancel": "Болдырмау",
  }
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("sun_lang") as Language;
    return saved || "en";
  });

  useEffect(() => {
    if (user?.language) {
      setLanguageState(user.language as Language);
      localStorage.setItem("sun_lang", user.language);
    }
  }, [user?.language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("sun_lang", lang);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    let str = dictionary[language][key] || dictionary["en"][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v));
      });
    }
    return str;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
