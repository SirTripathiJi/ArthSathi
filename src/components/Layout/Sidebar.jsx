import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, LogOut, Package, Receipt, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DB } from '../../services/db';
import { Logo } from '../UI/Logo';

export function Sidebar({ isOpen, toggleSidebar }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      const products = DB.getProducts(user.uid);
      setLowStockCount(products.filter((x) => Number(x.qty) <= Number(x.lowStock) && Number(x.qty) > 0).length);
    }
  }, [user]);

  const nav = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('overview') },
    { to: '/inventory', icon: Package, label: t('inventory'), badge: lowStockCount },
    { to: '/sales', icon: Receipt, label: t('billing') },
    { to: '/analytics', icon: LineChart, label: t('insights') },
    { to: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-[199] md:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => toggleSidebar(false)}
      />

      <aside
        className={`w-[260px] bg-[var(--surface)] border-r-4 border-black flex flex-col fixed top-0 bottom-0 left-0 z-[200] transition-transform duration-200 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b-4 border-black bg-[var(--color-brand)]/10">
          <Logo size="sm" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-8 flex flex-col gap-2 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} onClick={() => toggleSidebar(false)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 font-black text-sm border-2 border-transparent transition-all group ${
                  isActive 
                    ? 'bg-black text-white shadow-[4px_4px_0_var(--color-brand)]' 
                    : 'text-black hover:bg-white hover:border-black hover:shadow-[4px_4px_0_#000]'
                }`
              }>
              <Icon className="w-5 h-5" />
              <span className="flex-1 uppercase tracking-tight">{label}</span>
              {badge > 0 && (
                <span className="bg-[var(--color-secondary)] text-white text-[10px] font-black px-2 py-0.5 border-2 border-black">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t-4 border-black bg-[var(--surface2)]">
          <div className="flex items-center gap-3 px-3 py-3 border-2 border-black bg-white shadow-[3px_3px_0_#000] mb-4">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-lg border-2 border-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm text-black truncate uppercase">{user?.name || 'User'}</p>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{user?.store || 'My Store'}</p>
            </div>
          </div>
          <button
            onClick={() => { toggleSidebar(false); logout(); }}
            className="flex items-center justify-center gap-3 px-4 py-3 border-2 border-black font-black text-sm w-full bg-white hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="uppercase">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
