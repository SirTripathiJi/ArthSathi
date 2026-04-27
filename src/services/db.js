export const DB = {
  getUsers: () => JSON.parse(localStorage.getItem('as_users') || '[]'),
  setUsers: (u) => localStorage.setItem('as_users', JSON.stringify(u)),
  getSession: () => JSON.parse(localStorage.getItem('as_session') || 'null'),
  setSession: (s) => localStorage.setItem('as_session', JSON.stringify(s)),
  clearSession: () => localStorage.removeItem('as_session'),
  getProducts: (uid) => JSON.parse(localStorage.getItem(`as_p_${uid}`) || '[]'),
  setProducts: (uid, p) => localStorage.setItem(`as_p_${uid}`, JSON.stringify(p)),
  getSales: (uid) => {
    // Migration: ensure old single-item sales have an items array and total if needed.
    // They usually have: { id, pid, name, qty, amt, profit, date }
    // We will leave them mostly alone but UI can adapt.
    return JSON.parse(localStorage.getItem(`as_s_${uid}`) || '[]');
  },
  setSales: (uid, s) => localStorage.setItem(`as_s_${uid}`, JSON.stringify(s)),
  getCustomers: (uid) => JSON.parse(localStorage.getItem(`as_c_${uid}`) || '[]'),
  setCustomers: (uid, c) => localStorage.setItem(`as_c_${uid}`, JSON.stringify(c)),
  
  // Helpers
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
};
