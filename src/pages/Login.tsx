import { useMsal } from '@azure/msal-react';
import {loginRequest} from '../config/authConfig';

export default function Login() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((error) => {
      console.error("Error en la autenticación:", error);
    });
  }; 

  return (
    <div className="min-h-screen bg-[#F0F4F4] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        
        <div className="bg-[#183931] px-8 py-10 flex flex-col items-center justify-center text-center">
          <div className="bg-[#C86A51] p-3 rounded-lg mb-4 shadow-sm">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Red Hospedaje
          </h1>
          
          <p className="text-[#82A098] text-[10px] font-bold tracking-widest uppercase mt-3">
            AndesStay • Acceso Corporativo
          </p>
        </div>

        <div className="p-8 flex flex-col items-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Iniciar Sesión</h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Autenticación segura mediante Azure AD para gestionar reservas, catálogo y reportes.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3.5 rounded-lg font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#183931] cursor-pointer"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 21 21" 
              width="20" 
              height="20" 
              className="shrink-0"
            >
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            <span>Continuar con Microsoft</span>
          </button>
        </div>
      </div>
    </div>
  );
}