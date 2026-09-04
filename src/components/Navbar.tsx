import { Link, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useUserRole } from '../hooks/useUserRole';

export default function Navbar() {
  const location = useLocation();
  const { instance } = useMsal();
  const { fullName, initials, primaryRole, isAdmin, isRecepcionista, isAuditor } = useUserRole();

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/login',
    });
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', visible: true },
    { name: 'Reservas', path: '/reservations', visible: true },
    { name: 'Catálogo', path: '/catalog', visible: isAdmin || isRecepcionista },
    { name: 'Reportería', path: '/reports', visible: isAdmin },
    { name: 'Auditoría', path: '/audit', visible: isAdmin || isAuditor },
  ];

  const visibleLinks = navLinks.filter((link) => link.visible);

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

        {/* Enlaces según rol */}
        <nav>
          <ul className="flex space-x-1">
            {visibleLinks.map((link) => {
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

      {/* Zona derecha: En vivo, Avatar dinámico y Logout */}
      <div className="flex items-center gap-5 text-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          En vivo
        </div>

        <div className="h-6 w-px bg-[#2A5C53]"></div>

        {/* Datos reales obtenidos del token */}
        <div className="flex items-center gap-3">
          <div className="bg-[#2A5C53] text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-xs tracking-wider border border-[#3A7266]">
            {initials}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-gray-100 font-medium text-xs leading-tight">
              {fullName}
            </span>
            <span className="text-[#82A098] font-bold text-[10px] tracking-wider uppercase">
              {primaryRole}
            </span>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-[#2A5C53] rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}