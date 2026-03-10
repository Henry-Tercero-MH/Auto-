import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/sheetsApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('drivebot_user')); }
    catch { return null; }
  });

  // Lista de mecánicos cargada desde Sheets (con PIN)
  const [mecanicosLogin, setMecanicosLogin] = useState([]);

  useEffect(() => {
    // Cargar mecánicos con PIN desde hoja Mecanicos
    api.getMecanicos()
      .then((data) => {
        const activos = data.filter((m) => {
          const activo = m.activo === true || m.activo === 'true' || m.activo === 1 || m.activo === '1';
          return activo && m.pin;
        });
        if (activos.length) setMecanicosLogin(activos);
      })
      .catch(() => {});
  }, []);

  /**
   * Verifica si la hora/día actual están dentro del horario permitido en Config.
   * Retorna true si está permitido, false si está fuera de horario.
   * Si la API falla o el horario no está activo, siempre permite el acceso.
   */
  const verificarHorario = async () => {
    try {
      const cfg = await api.getConfig();
      console.log('[Horario] cfg completo:', cfg);

      if (!cfg || (cfg.horario_activo !== 'true' && cfg.horario_activo !== true)) {
        console.log('[Horario] inactivo o sin config → permitido');
        return true;
      }

      // Sheets serializa celdas de tiempo como ISO (ej: '1899-12-30T13:00:00.000Z')
      // parseHM extrae horas/minutos correctamente en ambos formatos
      const parseHM = (val) => {
        const s = String(val || '');
        if (s.includes('T')) { const d = new Date(s); return [d.getHours(), d.getMinutes()]; }
        const [h, m] = s.split(':').map(Number);
        return [isNaN(h) ? 0 : h, isNaN(m) ? 0 : m];
      };

      const now    = new Date();
      const dia    = now.getDay();
      const diasRaw = cfg.horario_dias || '1,2,3,4,5,6';
      const dias   = String(diasRaw).split(',').map(Number);
      const minNow = now.getHours() * 60 + now.getMinutes();
      const [hIni, mIni] = parseHM(cfg.horario_inicio || '08:00');
      const [hFin, mFin] = parseHM(cfg.horario_fin    || '18:00');
      const minIni = hIni * 60 + mIni;
      const minFin = hFin * 60 + mFin;

      console.log('[Horario] dia actual:', dia, '| dias permitidos:', dias);
      console.log('[Horario] hora actual (min):', minNow, '| rango:', minIni, '-', minFin);
      console.log('[Horario] diaOk:', dias.includes(dia), '| horaOk:', minNow >= minIni && minNow < minFin);

      if (!dias.includes(dia)) return false;
      return minNow >= minIni && minNow < minFin;
    } catch (err) {
      console.error('[Horario] error → permitido por defecto:', err);
      return true;
    }
  };

  /**
   * Login unificado (async).
   * Admin:    login({ email, password })
   * Mecánico: login({ mecanicoNombre, pin })
   * Devuelve: true | false | 'horario'
   */
  const login = async ({ email, password, mecanicoNombre, pin } = {}) => {

    // ── Admin / Supervisor ──────────────────────────────────────────────
    if (email && password) {
      try {
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
    if (mecanicoNombre && pin) {
      const nombreLower = mecanicoNombre.trim().toLowerCase();

      // Si aún no cargaron los mecánicos (carga async), los pedimos ahora
      let lista = mecanicosLogin;
      if (!lista.length) {
        try {
          const data = await api.getMecanicos();
          console.log('[Login Mec] data cruda desde Sheets:', data);
          lista = data.filter((m) => {
            const activo = m.activo == null || m.activo === true || m.activo === 'true' || m.activo === 1 || m.activo === '1' || String(m.activo).toUpperCase() === 'TRUE';
            return activo && m.pin;
          });
          if (lista.length) setMecanicosLogin(lista);
        } catch (err) {
          console.error('[Login Mec] error al obtener mecánicos:', err);
        }
      }

      console.log('[Login Mec] lista disponible:', lista);
      console.log('[Login Mec] buscando nombre:', nombreLower, '| pin:', pin);
      lista.forEach((m, i) => {
        console.log(`  [${i}] nombre="${m.nombre}" activo=${m.activo} pin="${m.pin}"`);
      });

      const esActivoSheet = (m) =>
        m.activo === true || m.activo === 'true' || m.activo === 1 || m.activo === '1'
        || String(m.activo).toUpperCase() === 'TRUE';
      const mec = lista.find(
        (m) => (m.nombre || m.name || '').trim().toLowerCase() === nombreLower
          && String(m.pin).trim() === String(pin).trim()
          && esActivoSheet(m)
      );
      console.log('[Login Mec] resultado find:', mec);
      if (mec) {
        const permitido = await verificarHorario();
        if (!permitido) return 'horario';
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
