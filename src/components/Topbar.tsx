import { Link, useLocation } from 'react-router-dom';

export default function Topbar() {
  const location = useLocation();

  // Aquí más adelante usarás tu hook de MSAL, por ejemplo:
  // const { account, logout } = useAuth();
  // const userName = account?.name || 'María José';

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Reservas', path: '/reservations' },
    { name: 'Catálogo', path: '/catalog' },
    { name: 'Reportería', path: '/reports' },
    { name: 'Auditoría', path: '/audit' },
  ];

  return (
    <header className="bg-[#1A423B] text-white flex items-center justify-between px-6 h-16 shrink-0 shadow-sm z-10 relative">
      <div className="flex items-center gap-8">
        
        {/* Logo de la Red */}
        <div className="flex items-center gap-2 font-semibold text-lg tracking-wide">
          <div className="bg-[#CB6D51] p-1.5 rounded-md shadow-inner">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          Red Hospedaje
        </div>

        {/* Enlaces de Navegación */}
        <nav>
          <ul className="flex space-x-1">
            {navLinks.map((link) => {
              // Verifica si la ruta actual coincide con el enlace para pintarlo de naranja
              const isActive = location.pathname.includes(link.path);
              return (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#CB6D51] text-white shadow-sm' 
                        : 'text-[#9CA3AF] hover:text-white hover:bg-[#2A5C53]'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Zona de Perfil y Estado Derecho */}
      <div className="flex items-center gap-5 text-sm">
        
        {/* Indicador de conexión en tiempo real */}
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          En vivo
        </div>

        {/* Separador vertical */}
        <div className="h-6 w-px bg-[#2A5C53]"></div>

        {/* Avatar y Nombre de Usuario */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="bg-[#2A5C53] text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-xs tracking-wider shadow-sm border border-[#3A7266]">
            MJ
          </div>
          <span className="text-gray-200 font-medium tracking-wide">
            María José
          </span>
        </div>
      </div>
    </header>
  );
}