import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../imagenes/logoMecanica.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(form.email, form.password);
      if (ok) {
        navigate('/');
      } else {
        setError('Correo o contraseña incorrectos');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo — Logo */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 bg-white flex-col items-center justify-center md:px-8 lg:px-12 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-center">
          <img
            src={logo}
            alt="AUTO+"
            className="w-52 lg:w-72 object-contain"
          />
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-primary relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent opacity-10 rounded-full" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-accent opacity-10 rounded-full" />
        <div className="w-full max-w-md">

          {/* Logo móvil (solo visible en pantallas pequeñas) */}
          <div className="flex justify-center mb-8 md:hidden">
            <div className="bg-white rounded-xl p-3 shadow-md">
              <img src={logo} alt="AUTO+" className="h-20 object-contain" />
            </div>
          </div>

          <div className="mb-8 relative z-10">
            <h2 className="text-2xl font-bold text-white">Bienvenido de nuevo</h2>
            <p className="text-slate-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-600 rounded-xl px-4 py-3 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                placeholder="admin@drivebot.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-600 rounded-xl px-4 py-3 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/40 text-red-300 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-slate-700/50 rounded-xl border border-slate-600 text-xs text-slate-400 space-y-1 relative z-10">
            <p className="font-semibold text-slate-300">Credenciales de demo:</p>
            <p>Email: <span className="font-mono text-slate-200">admin@drivebot.com</span></p>
            <p>Contraseña: <span className="font-mono text-slate-200">admin123</span></p>
          </div>
        </div>
      </div>

    </div>
  );
}
