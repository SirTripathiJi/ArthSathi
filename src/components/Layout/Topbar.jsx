import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const PAGE_KEYS = {
  dashboard: 'overview', inventory: 'inventory', sales: 'billing',
  analytics: 'insights', settings: 'settings',
};

export function Topbar({ toggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { lang, changeLanguage, t, LANGS } = useLanguage();
  const path = location.pathname.split('/')[1] || 'dashboard';
  const titleKey = PAGE_KEYS[path] || 'overview';

  return (
    <header className="sticky top-0 z-[100] h-20 bg-[var(--surface)] border-b-4 border-black px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button onClick={() => toggleSidebar()}
          className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-black uppercase italic tracking-tighter">{t(titleKey)}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center border-2 border-black bg-white shadow-[3px_3px_0_#000]">
          <select value={lang} onChange={(e) => changeLanguage(e.target.value)}
            className="text-xs font-black uppercase bg-transparent text-black px-4 py-2 cursor-pointer focus:outline-none border-none">
            {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button onClick={toggleTheme} aria-label="Toggle theme"
          className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0_#000] hover:bg-[var(--color-brand)] transition-all active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
          {theme === 'dark' ? <Sun className="w-5 h-5 text-black" /> : <Moon className="w-5 h-5 text-black" />}
        </button>
      </div>
    </header>
  );
}
