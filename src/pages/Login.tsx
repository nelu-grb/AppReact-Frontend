import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';

export default function Login() {
  const { instance } = useMsal();

  // Función que redirige al inicio de sesión de Microsoft al hacer clic
  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((error) => {
      console.error("Error en la autenticación con Azure AD:", error);
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans text-gray-800">
      
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0070F3] rounded-lg flex items-center justify-center shadow-xs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 20h18M5 20l5-12 4 6 3-4 2 10" />
            </svg>
          </div>
          <span className="text-gray-900 text-lg font-semibold tracking-tight">AndesStay</span>
        </div>

        <button 
          type="button" 
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093V14m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ¿Necesitas ayuda?
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        
        <div className="w-12 h-12 bg-[#EBF3FF] text-[#0070F3] rounded-xl flex items-center justify-center mb-4 shadow-2xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight text-center mb-2">
          Bienvenida a AndesStay
        </h1>
        <p className="text-sm text-gray-500 text-center max-w-sm mb-8 leading-relaxed">
          Todo listo para una gran estadía.<br />
          Inicia sesión para gestionar tu operación.
        </p>

        {/* TARJETA DE INICIO DE SESIÓN */}
        <div className="w-full max-w-md bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Acceso Corporativo</h2>
          <p className="text-xs text-gray-400 mb-6">
            Autenticación segura mediante Azure AD para gestionar reservas, catálogo y reportes.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#0070F3] hover:bg-blue-600 text-white py-3.5 px-5 rounded-xl text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 21 21" 
              width="18" 
              height="18" 
              className="shrink-0 fill-current"
            >
              <rect x="1" y="1" width="9" height="9" fill="#ffffff" />
              <rect x="1" y="11" width="9" height="9" fill="#ffffff" />
              <rect x="11" y="1" width="9" height="9" fill="#ffffff" />
              <rect x="11" y="11" width="9" height="9" fill="#ffffff" />
            </svg>
            <span>Iniciar sesión con Microsoft</span>
          </button>

          <div className="mt-6 pt-4 border-t border-gray-100 w-full text-center">
            <p className="text-xs text-gray-400">
              ¿No tienes acceso? Contacta a tu administrador.
            </p>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Conexión segura · Tu información está protegida</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Términos de servicio</a>
            <span>© 2026 AndesStay</span>
          </div>
        </div>

      </main>
    </div>
  );
}