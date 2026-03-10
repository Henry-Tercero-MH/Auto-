import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/sheetsApi';

const AuthContext = createContext(null);

// ── Mecánicos fallback ────────────────────────────────────────────────────
const MECANICOS_FALLBACK = [
  { id: 'M001', nombre: 'Pedro Hernández',   especialidad: 'Motor y transmisión', pin: '1234', activo: true },
  { id: 'M002', nombre: 'Juan Carlos López', especialidad: 'Frenos y suspensión', pin: '2345', activo: true },
  { id: 'M003', nombre: 'Marco Tulio Reyes', especialidad: 'Sistema eléctrico',   pin: '3456', activo: true },
  { id: 'M004', nombre: 'José Alfredo Ruiz', especialidad: 'Tren delantero',      pin: '4567', activo: true },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('drivebot_user')); }
    catch { return null; }
  });

  // Lista de mecánicos cargada desde Sheets (con PIN)
  const [mecanicosLogin, setMecanicosLogin] = useState(MECANICOS_FALLBACK);

  useEffect(() => {
    // Cargar mecánicos con PIN desde hoja Mecanicos
    api.getMecanicos()
      .then((data) => {
        const activos = data.filter((m) => m.activo && m.pin);
        if (activos.length) setMecanicosLogin(activos);
      })
      .catch(() => {});
  }, []);

  /**
   * Login unificado (async).
   * Admin:    login({ email, password })
   * Mecánico: login({ mecanicoId, pin })
   * Devuelve true/false
   */
  const login = async ({ email, password, mecanicoId, pin } = {}) => {

    // ── Admin / Supervisor ──────────────────────────────────────────────
    if (email && password) {
      try {
        // Consulta Sheets en tiempo real para no depender del estado cargado
        const usuarios = await api.getUsuarios();
        const found = usuarios.find(
          (u) => u.email === email && String(u.password) === String(password) && u.activo
        );
        if (found) {
          const u = { id: found.id, email, name: found.nombre, rol: found.rol };
          setUser(u);
          localStorage.setItem('drivebot_user', JSON.stringify(u));
          api.log({ accion: 'login', entidad: 'Usuario', entidad_id: found.id, usuario: found.nombre });
          return true;
        }
      } catch (e) {
        console.error('Error al consultar usuarios:', e);
      }
      return false;
    }

    // ── Mecánico ────────────────────────────────────────────────────────
    if (mecanicoId && pin) {
      const mec = mecanicosLogin.find(
        (m) => m.id === mecanicoId && String(m.pin) === String(pin) && m.activo
      );
      if (mec) {
        const u = { id: mec.id, name: mec.nombre || mec.name, especialidad: mec.especialidad, rol: 'mecanico' };
        setUser(u);
        localStorage.setItem('drivebot_user', JSON.stringify(u));
        api.log({ accion: 'login', entidad: 'Mecanico', entidad_id: mec.id, usuario: u.name });
        return true;
      }
      return false;
    }

    return false;
  };

  const logout = () => {
    if (user) api.log({ accion: 'logout', entidad: user.rol, entidad_id: user.id || '', usuario: user.name }).catch(() => {});
    setUser(null);
    localStorage.removeItem('drivebot_user');
  };

  const esAdmin    = user?.rol === 'admin' || user?.rol === 'supervisor';
  const esMecanico = user?.rol === 'mecanico';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        esAdmin,
        esMecanico,
        mecanicosDemo: mecanicosLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
