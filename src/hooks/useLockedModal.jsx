import { useState } from 'react';
import LockedFeatureModal from '../components/LockedFeatureModal';

/** Hook para usar el modal de módulo bloqueado desde cualquier componente */
export function useLockedModal() {
  const [modalState, setModalState] = useState({ open: false, featureName: '' });

  const showLocked = (featureName) => setModalState({ open: true, featureName });
  const closeLocked = () => setModalState({ open: false, featureName: '' });

  const LockedModal = () => (
    <LockedFeatureModal
      isOpen={modalState.open}
      onClose={closeLocked}
      featureName={modalState.featureName}
    />
  );

  return { showLocked, closeLocked, LockedModal };
}
