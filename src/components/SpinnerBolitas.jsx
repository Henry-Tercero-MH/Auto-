export default function SpinnerBolitas({ texto = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-primary inline-block"
            style={{
              animation: 'bounce-dot 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      {texto && <p className="text-sm text-slate-400 font-medium">{texto}</p>}
      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
