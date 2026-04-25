import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/UI/Logo';
import { useToast } from '../components/UI/ToastContext';
import { useAuth } from '../context/AuthContext';
import { DB } from '../services/db';

export function AuthPage() {
  const [tab, setTab] = useState('login');
  const navigate = useNavigate();
  const { login: setSession } = useAuth();
  const toast = useToast();

  const [logEmail, setLogEmail] = useState('');
  const [logPass, setLogPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regStore, setRegStore] = useState('');
  const [regPass, setRegPass] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const email = logEmail.trim().toLowerCase();
    if (!email || !logPass) return toast.error('Required fields missing');
    const users = DB.getUsers();
    const user = users.find((u) => u.email === email && u.pass === logPass);
    if (!user) return toast.error('Invalid credentials');
    setSession({ uid: user.uid, name: user.name, store: user.store });
    navigate('/dashboard');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const email = regEmail.trim().toLowerCase();
    if (!regName || !email || !regStore || !regPass) return toast.error('All fields are required');
    if (regPass.length < 6) return toast.error('Password too short');
    const users = DB.getUsers();
    if (users.find((u) => u.email === email)) return toast.error('Account already exists');
    const newUser = { uid: 'u_' + Date.now(), name: regName, email, store: regStore, pass: regPass };
    users.push(newUser);
    DB.setUsers(users);
    setSession({ uid: newUser.uid, name: newUser.name, store: newUser.store });
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#FFD600', '#FF4081', '#000000'] });
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative bg-[var(--bg-primary)] p-6">
      <button
        className="absolute top-10 left-10 p-4 border-2 border-[var(--border-color)] bg-[var(--card-bg)] shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all z-10"
        onClick={() => navigate('/')}>
        <ArrowLeft className="w-6 h-6 text-[var(--text-primary)]" />
      </button>

      <div className="w-full max-w-[450px] brutalist-card p-12 relative z-10">
        <div className="flex justify-center mb-12 scale-125"><Logo /></div>

        {/* Tab switcher */}
        <div className="flex border-4 border-[var(--border-color)] p-1 bg-[var(--border-color)] mb-10 shadow-[4px_4px_0_var(--color-brand)]">
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-[var(--color-brand)] text-[#111111]' : 'text-[var(--bg-primary)] hover:text-[var(--color-brand)]'}`}>
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-8 animate-brutal-fade-in">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-3">Email Address</label>
                <input type="email" value={logEmail} onChange={e => setLogEmail(e.target.value)} className="brutalist-input" placeholder="name@business.com" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-3">Password</label>
                <input type="password" value={logPass} onChange={e => setLogPass(e.target.value)} className="brutalist-input" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" className="w-full brutalist-btn py-5 text-lg">
              Sign In to Dashboard
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-8 animate-brutal-fade-in">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-3">Full Name</label>
                <input value={regName} onChange={e => setRegName(e.target.value)} className="brutalist-input" placeholder="Rahul Sharma" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-3">Business Email</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="brutalist-input" placeholder="rahul@store.com" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-3">Store Name</label>
                <input value={regStore} onChange={e => setRegStore(e.target.value)} className="brutalist-input" placeholder="Sharma Retailers" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-3">Create Password</label>
                <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} className="brutalist-input" placeholder="Min. 6 characters" />
              </div>
            </div>
            <button type="submit" className="w-full brutalist-btn py-5 text-lg bg-[var(--color-secondary)] text-[#ffffff]">
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
