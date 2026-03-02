import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const DEMO = { email: 'admin@drivebot.com', password: 'admin123', name: 'Administrador' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('drivebot_user')); }
    catch { return null; }
  });

  const login = (email, password) => {
    if (email === DEMO.email && password === DEMO.password) {
      const u = { email, name: DEMO.name };
      setUser(u);
      localStorage.setItem('drivebot_user', JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('drivebot_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
