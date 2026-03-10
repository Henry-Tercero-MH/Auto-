import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Registrar Service Worker para PWA
registerSW({
  onNeedRefresh() {
    if (confirm('Hay una nueva versión de AUTO+. ¿Actualizar?')) {
      location.reload()
    }
  },
  onOfflineReady() {
    console.log('AUTO+ disponible offline')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
