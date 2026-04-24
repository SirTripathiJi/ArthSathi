import { createContext, useContext, useEffect, useState } from 'react';

import { DB } from '../services/db';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = DB.getSession();
    if (session && session.uid) {
      setUser(session);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    DB.setSession(userData);
    setUser(userData);
  };

  const logout = () => {
    DB.clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
