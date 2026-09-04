import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Reservas', path: '/reservations' },
    { name: 'Catálogo', path: '/catalog' },
    { name: 'Reportería', path: '/reports' },
    { name: 'Auditoría', path: '/audit' },
  ];

  return (
    <nav className="bg-[#1A423B] text-white flex items-center justify-between px-6 h-16">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="bg-[#CB6D51] p-1.5 rounded-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          Red Hospedaje
        </div>

        {/* Links de navegación */}
        <ul className="flex space-x-1">
          {navLinks.map((link) => {
            const isActive = location.pathname.includes(link.path);
            return (
              <li key={link.name}>
                <Link 
                  to={link.path} 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#CB6D51] text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Perfil usuario derecho */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-green-400">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          En vivo
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#2A5C53] text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">
            MJ
          </div>
          <span className="text-gray-200">María José</span>
        </div>
      </div>
    </nav>
  );
}