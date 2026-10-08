import { createContext, useContext, type ReactNode, useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';

// 1. Definición de los tipos de datos que provee el contexto
interface AuthContextType {
  fullName: string;
  initials: string;
  roles: string[];
  primaryRole: string;
  isAdmin: boolean;
  isRecepcionista: boolean;
  isHuesped: boolean;
  isAuditor: boolean;
  hasAnyRole: (allowedRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 2. Componente Provider principal
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { accounts, instance, inProgress } = useMsal();
  
  // Estado para controlar la recuperación silenciosa de permisos
  const [renewalState, setRenewalState] = useState<'idle' | 'renewing' | 'done'>('idle');

  // Identificación de la cuenta activa
  const activeAccount = instance.getActiveAccount() ?? (accounts.length > 0 ? accounts[0] : null);
  
  const idTokenClaims = activeAccount?.idTokenClaims as any;
  const roles = idTokenClaims?.roles; 

  useEffect(() => {
    const checkAndRenewRoles = async () => {
      // Si MSAL está ocupado procesando algo, esperamos
      if (inProgress !== InteractionStatus.None) return;

      // SI NO HAY CUENTA: No hacemos nada y dejamos que React Router muestre la vista de /login
      if (!activeAccount) return;

      // Si hay una cuenta pero faltan los roles, los recuperamos silenciosamente
      if (roles === undefined && renewalState === 'idle') {
        setRenewalState('renewing');
        console.log("Memoria de roles vacía. Recuperando permisos silenciosamente...");
        try {
          await instance.acquireTokenSilent({
            scopes: ["openid", "profile"],
            account: activeAccount,
            forceRefresh: true // Solicita un token actualizado con los roles
          });
        } catch (error) {
          console.warn("Falló la renovación invisible. Redirigiendo a inicio de sesión...", error);
          instance.loginRedirect();
        } finally {
          setRenewalState('done');
        }
      }
    };

    checkAndRenewRoles();
  }, [inProgress, activeAccount, roles, renewalState, instance]);

  // Se muestra la pantalla de carga ÚNICAMENTE si hay una cuenta activa y se están validando sus roles
  const isCheckingRoles = 
    activeAccount !== null && (
      inProgress !== InteractionStatus.None || 
      renewalState === 'renewing' || 
      (roles === undefined && renewalState === 'idle')
    );

  if (isCheckingRoles) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F6F9] font-sans">
        <span className="text-lg font-semibold text-gray-700">
          {renewalState === 'renewing' ? 'Recuperando permisos...' : 'Verificando sesión...'}
        </span>
      </div>
    );
  }

  // 3. Extracción y normalización de roles (con valores por defecto si no hay sesión)
  const finalRoles: string[] = activeAccount ? (roles || []) : [];
  const fullName: string = activeAccount ? (activeAccount.name || idTokenClaims?.name || 'Usuario') : '';

  const nameParts = fullName.trim().split(' ').filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase() || 'US';

  const normalizeRole = (role: string) =>
    role.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    
  const normalizedRoles = finalRoles.map(normalizeRole);
  const isAdmin = normalizedRoles.includes('admin') || normalizedRoles.includes('administrador');
  const isRecepcionista = normalizedRoles.includes('recepcionista') || normalizedRoles.includes('operador');
  const isHuesped = normalizedRoles.includes('huesped');
  const isAuditor = normalizedRoles.includes('auditor');

  const primaryRole =
    isAdmin ? 'ADMIN' :
    isRecepcionista ? 'RECEPCIONISTA' :
    isAuditor ? 'AUDITOR' :
    isHuesped ? 'HUÉSPED' : 
    'Por Defecto';

  const hasAnyRole = (allowedRoles: string[]): boolean => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    return normalizedRoles.some((role) => normalizedAllowed.includes(role));
  };

  return (
    <AuthContext.Provider value={{
      fullName, initials, roles: finalRoles, primaryRole, isAdmin, isRecepcionista, isHuesped, isAuditor, hasAnyRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};