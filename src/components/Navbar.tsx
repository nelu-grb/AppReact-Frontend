import { useMsal } from '@azure/msal-react';
import { NavLink } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

export default function Navbar() {
  const { instance } = useMsal();
  const { fullName, initials, primaryRole, isAdmin, isRecepcionista, isAuditor } = useUserRole();

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/login',
    }).catch(console.error);
  };

  // Enlaces y visibilidad según rol (RBAC)
  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', show: true },
    { label: 'Reservas', path: '/reservations', show: !isAuditor },
    { label: 'Catálogo', path: '/catalog', show: isAdmin || isRecepcionista },
    { label: 'Reportería', path: '/reports', show: isAdmin },
    { label: 'Auditoría', path: '/audit', show: isAdmin || isAuditor },
  ];

  return (
    <header className="bg-[#1A423B] text-white px-6 py-3 flex items-center justify-between shadow-md">
      {/* Lado izquierdo: Logo e hipervínculos */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5 font-bold text-lg tracking-wide">
          <span className="p-1.5 bg-[#CB6D51] rounded text-white text-xs font-black leading-none">
            RH
          </span>
          <span className="text-white text-base">Red Hospedaje</span>
        </div>

        <nav className="flex items-center gap-1.5">
          {navLinks
            .filter((link) => link.show)
            .map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#CB6D51] text-white shadow-xs'
                      : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
        </nav>
      </div>

      {/* Lado derecho: Estado en vivo, perfil y logout */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>En vivo</span>
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-emerald-900/50">
          <div className="w-8 h-8 rounded-full bg-[#24534B] border border-emerald-700/60 flex items-center justify-center font-bold text-xs text-white">
            {initials}
          </div>
          <div className="text-left leading-tight hidden md:block">
            <p className="text-xs font-semibold text-white">{fullName}</p>
            <p className="text-[10px] text-gray-300 tracking-wider font-mono font-medium">
              {primaryRole}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="text-emerald-200/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}