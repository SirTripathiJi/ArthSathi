import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Trash2, Sun, Moon, AlertTriangle, Globe } from 'lucide-react';
import { Modal } from '../components/UI/Modal';
import { useToast } from '../components/UI/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DB } from '../services/db';

export function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const { t, lang, changeLanguage, LANGS } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);

  const clearData = () => {
    if (!user?.uid) return;
    DB.setProducts(user.uid, []);
    DB.setSales(user.uid, []);
    toast.info('All business data has been deleted.');
    setShowConfirm(false);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl space-y-12">
      <div className="space-y-4 border-l-8 border-black pl-8">
        <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">{t('settings')}</h2>
        <p className="text-lg font-bold text-gray-600">Manage your account preferences and global data security.</p>
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <div className="brutalist-card bg-white">
          <div className="flex justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 border-4 border-black bg-[var(--color-brand)] flex items-center justify-center shadow-[4px_4px_0_#000]">
                {theme === 'dark' ? <Moon className="w-8 h-8" /> : <Sun className="w-8 h-8" />}
              </div>
              <div>
                <h4 className="text-xl font-black uppercase tracking-tighter mb-1">{t('dark_mode')}</h4>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest italic">{t('dark_mode_desc')}</p>
              </div>
            </div>
            <button onClick={toggleTheme} className={`relative w-16 h-8 border-4 border-black transition-colors ${theme === 'dark' ? 'bg-[var(--color-brand)]' : 'bg-white'}`}>
              <div className={`absolute top-0 bottom-0 w-6 bg-black transition-all ${theme === 'dark' ? 'right-0' : 'left-0'}`} />
            </button>
          </div>
        </div>

        {/* Language Section */}
        <div className="brutalist-card bg-white">
          <div className="flex justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 border-4 border-black bg-[var(--color-accent)] flex items-center justify-center shadow-[4px_4px_0_#000]">
                <Globe className="w-8 h-8 text-black" />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase tracking-tighter mb-1">Language</h4>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Localized interface settings</p>
              </div>
            </div>
            <select value={lang} onChange={(e) => changeLanguage(e.target.value)}
              className="brutalist-input !w-auto !py-3 !px-6 bg-white font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_#000]">
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Security Section */}
        <div className="brutalist-card bg-red-50 border-red-500">
          <div className="flex justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 border-4 border-black bg-red-500 flex items-center justify-center shadow-[4px_4px_0_#000] text-white">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase tracking-tighter mb-1">{t('reset_data')}</h4>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest italic">{t('reset_data_desc')}</p>
              </div>
            </div>
            <button className="brutalist-btn bg-red-500 text-white px-8" onClick={() => setShowConfirm(true)}>
              {t('delete_all')}
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="p-10 border-4 border-black bg-black text-white flex gap-10 items-center shadow-[10px_10px_0_var(--color-brand)]">
        <div className="w-20 h-20 bg-[var(--color-brand)] border-2 border-white flex items-center justify-center text-black flex-shrink-0">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <div>
          <h4 className="font-black text-2xl uppercase italic tracking-tighter mb-3">{t('trust')}</h4>
          <p className="text-base font-bold text-gray-300 leading-tight">{t('support')}</p>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title={t('reset_data')}
        actions={
          <div className="flex gap-6">
            <button className="text-sm font-black uppercase underline decoration-2" onClick={() => setShowConfirm(false)}>{t('cancel')}</button>
            <button className="brutalist-btn bg-red-500 text-white px-10" onClick={clearData}>{t('delete_all')}</button>
          </div>
        }>
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-24 h-24 border-4 border-black bg-red-100 flex items-center justify-center text-red-600 mb-8 shadow-[6px_6px_0_#000]">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-4">Delete Enterprise Data?</h3>
          <p className="text-black font-bold text-lg leading-tight">This action will permanently wipe all product records, transactional history, and business metrics. This cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
}
