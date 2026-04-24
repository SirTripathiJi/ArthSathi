import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, LineChart,
  Package, Receipt, ShieldCheck, Sun, Moon,
} from 'lucide-react';
import { Logo } from '../components/UI/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { lang, changeLanguage, LANGS } = useLanguage();

  const go = () => navigate(user ? '/dashboard' : '/auth');

  const features = [
    { icon: Package, title: 'Smart Inventory', text: 'Real-time tracking with intelligent stock alerts and expiry notifications.', color: 'var(--color-brand)' },
    { icon: Receipt, title: 'Seamless Billing', text: 'Automated sales recording with instant profit calculations and analytics.', color: 'var(--color-secondary)' },
    { icon: LineChart, title: 'Growth Analytics', text: 'Data-driven insights into your business performance and top-performing assets.', color: 'var(--color-accent)' },
    { icon: ShieldCheck, title: 'Privacy-First', text: 'Enterprise-grade security with 100% local data storage. No cloud required.', color: 'var(--color-success)' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-black">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 bg-white border-b-4 border-black">
        <Logo />
        <div className="flex items-center gap-6">
          <select value={lang} onChange={e => changeLanguage(e.target.value)}
            className="text-xs font-black bg-white border-2 border-black text-black px-3 py-1.5 focus:outline-none cursor-pointer shadow-[2px_2px_0_#000]">
            {LANGS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0_#000] hover:bg-[var(--color-brand)] transition-all">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={go} className="brutalist-btn hidden sm:flex">Launch App</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-20 md:pt-56 md:pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Floating Shapes Background */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-[var(--color-secondary)] border-4 border-black -rotate-12 opacity-20 hidden md:block"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-[var(--color-accent)] border-4 border-black rotate-12 opacity-20 hidden md:block rounded-full"></div>

        <div className="max-w-[1000px] space-y-10 relative z-10">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] text-black uppercase italic">
            RUN YOUR<br />
            <span className="text-[var(--color-brand)] bg-black px-4 shadow-[10px_10px_0_var(--color-secondary)]">BUSINESS</span><br />
            SMARTER.
          </h1>
          <p className="text-xl md:text-2xl font-bold text-black max-w-2xl mx-auto leading-tight border-l-8 border-black pl-6 text-left">
            Eliminate the guesswork. Track every unit, capture every margin, and scale your operations with the most advanced offline ledger.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16">
            <button onClick={go} className="brutalist-btn text-2xl px-12 py-6 bg-[var(--color-brand)]">
              Get Started <ArrowRight className="ml-3 w-6 h-6" />
            </button>
            <div className="text-xl font-black uppercase tracking-widest text-black underline decoration-4 underline-offset-8">
              100% Local. 0% Cloud.
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="brutalist-card group hover:-rotate-1">
                <div className="w-16 h-16 border-4 border-black flex items-center justify-center mb-8 shadow-[4px_4px_0_#000] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all"
                  style={{ backgroundColor: f.color }}>
                  <Icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{f.title}</h3>
                <p className="text-base font-bold text-gray-800 leading-tight">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-32 px-6 border-y-4 border-black bg-black text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <div>
            <div className="text-7xl font-black text-[var(--color-brand)] mb-2 tracking-tighter">10K+</div>
            <div className="text-xl font-black uppercase tracking-widest">Active Stores</div>
          </div>
          <div>
            <div className="text-7xl font-black text-[var(--color-secondary)] mb-2 tracking-tighter">100%</div>
            <div className="text-xl font-black uppercase tracking-widest">Data Privacy</div>
          </div>
          <div>
            <div className="text-7xl font-black text-[var(--color-accent)] mb-2 tracking-tighter">0$</div>
            <div className="text-xl font-black uppercase tracking-widest">Cloud Cost</div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-20 bg-white border-t-4 border-black text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <Logo />
          <div className="flex gap-10 text-sm font-black uppercase tracking-widest text-black underline decoration-2 underline-offset-4">
            <a href="#" className="hover:text-[var(--color-secondary)]">Privacy</a>
            <a href="#" className="hover:text-[var(--color-brand)]">Terms</a>
            <a href="mailto:tripathiakshat2604@gmail.com" className="hover:text-[var(--color-accent)]">Support</a>
          </div>
          <p className="text-sm font-black uppercase tracking-widest">© 2026 ArthSaathi. Built for the bold.</p>
        </div>
      </footer>
    </div>
  );
}
