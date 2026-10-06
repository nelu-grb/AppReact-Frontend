import { createContext, useContext, type ReactNode, useEffect, useState} from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';


// 1. Definimos los tipos de datos que devolverá el contexto
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

// 2. Creamos el Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { accounts, instance, inProgress } = useMsal();
  
  // 1. NUEVO: Un estado para controlar si estamos recuperando los roles silenciosamente
  const [renewalState, setRenewalState] = useState<'idle' | 'renewing' | 'done'>('idle');

  const activeAccount = instance.getActiveAccount() ?? (accounts.length > 0 ? accounts[0] : null);
  
  const idTokenClaims = activeAccount?.idTokenClaims as any;
  // Extraemos específicamente los roles para vigilar si Microsoft los borró
  const roles = idTokenClaims?.roles; 

  useEffect(() => {
    const checkAndRenewRoles = async () => {
      if (inProgress !== InteractionStatus.None) return;

      if (!activeAccount) {
        instance.loginRedirect();
        return;
      }

      // 2. LA MAGIA: Si hay cuenta, pero faltan los roles, abrimos un iframe invisible para recuperarlos
      if (roles === undefined && renewalState === 'idle') {
        setRenewalState('renewing');
        console.log("Memoria de roles vacía. Recuperando permisos silenciosamente...");
        try {
          await instance.acquireTokenSilent({
            scopes: ["openid", "profile"], // Puedes añadir tu client_id aquí si usas Access Tokens
            account: activeAccount,
            forceRefresh: true // Obliga a Microsoft a darnos un token fresco con los roles
          });
        } catch (error) {
          console.warn("Fallo la renovación invisible. Forzando login...", error);
          instance.loginRedirect();
        } finally {
          setRenewalState('done');
        }
      }
    };

    checkAndRenewRoles();
  }, [inProgress, activeAccount, roles, renewalState, instance]);

  // 3. EL CANDADO PERFECTO
  // Solo se abre si MSAL terminó, SI hay cuenta, y SI no estamos en medio de recuperar los roles
  const isWorking = 
    inProgress !== InteractionStatus.None || 
    renewalState === 'renewing' || 
    (roles === undefined && renewalState === 'idle');

  if (isWorking || !activeAccount) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <span className="text-xl font-semibold text-[#1b4332]">
          {renewalState === 'renewing' ? 'Recuperando permisos...' : 'Verificando sesión...'}
        </span>
      </div>
    );
  }

  // 4. Tu lógica de extracción (Solo llega aquí si los roles ya están asegurados)
  const finalRoles: string[] = roles || [];
  const fullName: string = activeAccount.name || idTokenClaims?.name || 'Usuario';

  const nameParts = fullName.trim().split(' ');
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
// 4. Exportamos el hook para usarlo fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};