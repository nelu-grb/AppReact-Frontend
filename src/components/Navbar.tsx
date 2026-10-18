import { useMsal } from '@azure/msal-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { instance } = useMsal();
  const { fullName, initials, primaryRole, isAdmin, isRecepcionista, isAuditor} = useAuth();

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/login',
    }).catch(console.error);
  };

  const navLinks = [
    { label: 'Resumen', path: '/dashboard', show: true },
    { label: 'Reservas', path: '/reservations', show: !isAuditor },
    { label: 'Catálogo', path: '/catalog', show: isAdmin || isRecepcionista },
    { label: 'Reportes', path: '/reports', show: isAdmin },
    { label: 'Auditoría', path: '/audit', show: isAdmin || isAuditor },
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Lado izquierdo: Logo e hipervínculos */}
      <div className="flex items-center gap-10">
        
        {/* Logo AndesStay */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            {/* SVG simplificado de las montañas del logo */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 20h18M5 20l5-12 4 6 3-4 2 10" />
            </svg>
          </div>
          <span className="text-gray-800 text-lg font-medium tracking-tight">AndesStay</span>
        </div>

        {/* Navegación */}
        <nav className="flex items-center gap-1">
          {navLinks
            .filter((link) => link.show)
            .map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* El puntito azul solo aparece si está activo */}
                    {isActive && <span className="text-blue-500 text-lg leading-none h-2 flex items-center">&bull;</span>}
                    {link.label}
                  </>
                )}
              </NavLink>
            ))}
        </nav>
      </div>

      {/* Lado derecho: Notificaciones y Perfil */}
      <div className="flex items-center gap-5">
        
        {/* Dropdown / Botón de perfil */}
        <button 
          onClick={handleLogout} 
          title="Cerrar sesión"
          // Cambiamos 'pl-1' por 'pl-4' para darle un poco de espacio al texto del rol
          className="flex items-center gap-3 pl-4 pr-3 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
        >
          {/* ---> NUEVO: Rol de la persona a la izquierda de la foto <--- */}
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {primaryRole}
          </span>

          {/* Foto de perfil (Iniciales) */}
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-xs text-blue-600">
            {initials}
          </div>

          {/* Nombre e ícono de flecha */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{fullName}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

      </div>
    </header>
  );
}