export const DB = {
  getUsers: () => JSON.parse(localStorage.getItem('as_users') || '[]'),
  setUsers: (u) => localStorage.setItem('as_users', JSON.stringify(u)),
  getSession: () => JSON.parse(localStorage.getItem('as_session') || 'null'),
  setSession: (s) => localStorage.setItem('as_session', JSON.stringify(s)),
  clearSession: () => localStorage.removeItem('as_session'),
  getProducts: (uid) => JSON.parse(localStorage.getItem(`as_p_${uid}`) || '[]'),
  setProducts: (uid, p) => localStorage.setItem(`as_p_${uid}`, JSON.stringify(p)),
  getSales: (uid) => JSON.parse(localStorage.getItem(`as_s_${uid}`) || '[]'),
  setSales: (uid, s) => localStorage.setItem(`as_s_${uid}`, JSON.stringify(s)),
  getCustomers: (uid) => JSON.parse(localStorage.getItem(`as_c_${uid}`) || '[]'),
  setCustomers: (uid, c) => localStorage.setItem(`as_c_${uid}`, JSON.stringify(c)),
};
