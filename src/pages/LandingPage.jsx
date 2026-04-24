import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, LineChart,
  Package, Receipt, ShieldCheck, Sun, Moon,
  Sparkles, Mic, TrendingUp, Users,
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
    { icon: Package,     title: 'Inventory Control',  text: 'Stay accurate, avoid losses, and never miss a restock.',     color: 'var(--color-brand)' },
    { icon: Receipt,     title: 'Billing Made Simple', text: 'Fast entries with instant, real profit visibility.',          color: 'var(--color-secondary)' },
    { icon: LineChart,   title: 'Business Insights',   text: 'Understand performance clearly. No noise, just useful data.', color: 'var(--color-accent)' },
    { icon: ShieldCheck, title: 'Privacy-First',       text: '100% local data storage. No cloud, no subscriptions.',       color: 'var(--color-success)' },
    { icon: Sparkles,    title: 'Smart Assistant',     text: 'Simple business guidance based on your data.',               color: 'var(--text3)', comingSoon: true },
    { icon: Mic,         title: 'Voice Entries',       text: 'Add transactions by speaking naturally.',                    color: 'var(--text3)', comingSoon: true },
    { icon: TrendingUp,  title: 'Profit Intelligence', text: 'See true profit after cost and expenses.',                   color: 'var(--text3)', comingSoon: true },
    { icon: Users,       title: 'Customer Insights',   text: 'Identify reliable and risky customers.',                    color: 'var(--text3)', comingSoon: true },
  ];

  const trustItems = [
    { title: 'Reliable by Design',    text: 'Built for real daily shop operations.',   color: 'var(--color-brand)' },
    { title: 'Complete Data Control', text: 'Your data stays private and accessible.', color: 'var(--color-secondary)' },
    { title: 'Flexible & Scalable',   text: 'Grows as your business grows.',           color: 'var(--color-accent)' },
    { title: 'Daily-Use Ready',       text: 'Fast, clear, and dependable every day.',  color: 'var(--color-success)' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans" style={{ overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 bg-[var(--surface)] border-b-4 border-[var(--border-color)]">
        <Logo />
        <div className="flex items-center gap-4">
          <select value={lang} onChange={e => changeLanguage(e.target.value)}
            className="text-xs font-black bg-[var(--surface)] border-2 border-[var(--border-color)] text-[var(--text)] px-3 py-1.5 focus:outline-none cursor-pointer shadow-[2px_2px_0_var(--border-color)]">
            {LANGS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          <button onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center border-2 border-[var(--border-color)] bg-[var(--surface)] shadow-[2px_2px_0_var(--border-color)] hover:bg-[var(--color-brand)] hover:text-[#000] transition-all">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-inherit" /> : <Moon className="w-5 h-5 text-inherit" />}
          </button>
          <button onClick={go} className="brutalist-btn hidden sm:flex">Launch App</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center animate-brutal-fade-in"
        style={{ paddingTop: 160, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, overflow: 'hidden' }}>
        {/* Background shapes — corners only, no text overlap */}
        <div className="absolute top-24 left-[4%] rounded-full bg-[var(--color-secondary)] border-4 border-[var(--border-color)] animate-float-slow hidden md:block pointer-events-none"
          style={{ width: 70, height: 70, opacity: 0.11, animationDelay: '0s' }} />
        <div className="absolute top-56 right-[4%] bg-[var(--color-accent)] border-4 border-[var(--border-color)] rotate-12 animate-float-slow hidden md:block pointer-events-none"
          style={{ width: 96, height: 96, opacity: 0.11, animationDelay: '2s' }} />
        <div className="absolute bottom-12 left-[16%] bg-[var(--color-brand)] border-4 border-[var(--border-color)] rotate-45 animate-float-slow hidden md:block pointer-events-none"
          style={{ width: 50, height: 50, opacity: 0.11, animationDelay: '4s' }} />

        <div className="relative z-10 w-full" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Headline */}
          <h1 className="font-black text-[var(--text)] uppercase italic w-full"
            style={{ fontSize: 'clamp(2.4rem, 6.5vw, 5rem)', lineHeight: 1.08, letterSpacing: '-0.04em', wordBreak: 'break-word' }}>
            Run your business
            <br />
            <span className="text-[var(--color-brand)] inline-block"
              style={{ background: 'var(--text)', padding: '6px 22px', marginTop: 14, boxShadow: '8px 8px 0 var(--color-secondary)', wordBreak: 'break-word', maxWidth: '100%' }}>
              with clarity.
            </span>
          </h1>

          {/* Sub-copy */}
          <div style={{ maxWidth: 660, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="font-bold text-[var(--text2)]" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', lineHeight: 1.55 }}>
              Track inventory, record sales, and know your exact profit — without confusion.
            </p>
            <p className="font-bold text-[var(--text3)]" style={{ fontSize: 'clamp(0.875rem, 1.6vw, 1.05rem)', lineHeight: 1.5 }}>
              Built for real shopkeepers. Fast. Offline. Reliable.
            </p>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <button onClick={go}
              className="brutalist-btn bg-[var(--color-brand)] text-[#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--border-color)] transition-all"
              style={{ fontSize: '1.2rem', padding: '16px 44px' }}>
              Get Started <ArrowRight className="ml-3 w-5 h-5" />
            </button>
            <span className="font-black uppercase tracking-widest text-[var(--text3)]" style={{ fontSize: '0.7rem' }}>
              No cloud. No subscriptions. 100% yours.
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="border-t-4 border-[var(--border-color)] bg-[var(--surface2)]"
        style={{ padding: '90px 24px' }}>
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ maxWidth: 1120, gap: 24 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i}
                className="brutalist-card flex flex-col items-start hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--border-color)] transition-all animate-brutal-fade-in"
                style={{ overflow: 'hidden', wordBreak: 'break-word', animationDelay: `${i * 0.07}s` }}>
                {/* Icon */}
                <div className="flex-shrink-0 border-4 border-[var(--border-color)] flex items-center justify-center shadow-[3px_3px_0_var(--border-color)]"
                  style={{ width: 52, height: 52, marginBottom: 16, backgroundColor: f.color }}>
                  <Icon className="w-6 h-6 text-[#000]" />
                </div>
                {/* Title */}
                <h3 className="font-black uppercase text-[var(--text)]"
                  style={{ fontSize: f.comingSoon ? '0.95rem' : '1.1rem', lineHeight: 1.15, letterSpacing: '-0.02em', wordBreak: 'break-word', marginBottom: 8 }}>
                  {f.title}
                </h3>
                {/* Badge */}
                {f.comingSoon && (
                  <span className="inline-block bg-[var(--surface)] border-2 border-[var(--border-color)] text-[var(--text3)] uppercase font-black tracking-widest"
                    style={{ fontSize: '8px', padding: '2px 6px', margin: '6px 0' }}>
                    Coming Soon
                  </span>
                )}
                {/* Description */}
                <p className="text-[var(--text2)] font-bold flex-1"
                  style={{ fontSize: '0.85rem', lineHeight: 1.55, marginTop: 8, wordBreak: 'break-word' }}>
                  {f.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-y-4 border-[var(--border-color)]" style={{ padding: '100px 24px', background: 'var(--text)' }}>
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 text-center" style={{ maxWidth: 1120, gap: 40 }}>
          {trustItems.map((item, i) => (
            <div key={i} style={{ wordBreak: 'break-word' }}>
              <div className="font-black uppercase tracking-tighter"
                style={{ color: item.color, fontSize: '1.35rem', lineHeight: 1.15, marginBottom: 10 }}>
                {item.title}
              </div>
              <div className="font-bold" style={{ color: 'var(--bg)', opacity: 0.88, fontSize: '0.95rem', lineHeight: 1.5 }}>
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--surface)] border-t-4 border-[var(--border-color)]" style={{ padding: '52px 24px' }}>
        <div className="mx-auto flex flex-col md:flex-row justify-between items-center" style={{ maxWidth: 1120, gap: 28 }}>
          <Logo />
          <div className="flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-widest text-[var(--text)] underline decoration-2 underline-offset-4">
            <a href="#" className="hover:text-[var(--color-secondary)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--color-brand)] transition-colors">Terms</a>
            <a href="mailto:tripathiakshat2604@gmail.com" className="hover:text-[var(--color-accent)] transition-colors">Support</a>
          </div>
          <p className="text-[var(--text3)] font-black uppercase tracking-widest text-center md:text-right"
            style={{ fontSize: '0.7rem', maxWidth: 260 }}>
            Built for business owners who value clarity today and smarter growth tomorrow.
          </p>
        </div>
      </footer>
    </div>
  );
}
