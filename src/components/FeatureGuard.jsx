import { Navigate } from 'react-router-dom';
import { isFeatureEnabled, getFeatureLabel } from '../config/rbac';
import { useLockedModal } from '../hooks/useLockedModal.jsx';
import { useEffect } from 'react';

/**
 * Guard de ruta que bloquea el acceso a módulos deshabilitados en el RBAC.
 *
 * Uso en App.jsx:
 *   <Route path="/reportes" element={<FeatureGuard path="/reportes"><Reportes /></FeatureGuard>} />
 *
 * Si el módulo está bloqueado:
 *   - Muestra el modal "Adquiere este servicio"
 *   - Redirige al Dashboard (/)
 */
export default function FeatureGuard({ path, children }) {
  const enabled = isFeatureEnabled(path);
  const { showLocked, LockedModal } = useLockedModal();

  useEffect(() => {
    if (!enabled) {
      showLocked(getFeatureLabel(path));
    }
  }, [enabled, path]);

  if (!enabled) {
    return (
      <>
        <LockedModal />
        <Navigate to="/" replace />
      </>
    );
  }

  return children;
}
