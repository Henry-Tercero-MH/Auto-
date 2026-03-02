import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Inicio', path: '/' },
  { name: 'Nueva Solicitud', path: '/nueva-solicitud' },
  { name: 'Servicios', path: '#' },
  { name: 'Contacto', path: '#' },
];

export default function Navbar() {
  const location = useLocation();
  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight text-accent">DriveBot</span>
        </div>
        <ul className="flex gap-6">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`hover:text-accent transition-colors duration-200 ${location.pathname === item.path ? 'text-accent' : ''}`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
