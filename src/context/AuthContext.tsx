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

type TokenClaims = Record<string, unknown>;

const getRolesFromClaims = (claims: object | undefined): string[] | undefined => {
  const roles = (claims as TokenClaims | undefined)?.roles;
  return Array.isArray(roles) && roles.every((role): role is string => typeof role === 'string')
    ? roles
    : undefined;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { accounts, instance, inProgress } = useMsal();
  const activeAccount = instance.getActiveAccount() ?? (accounts.length > 0 ? accounts[0] : null);
  const accountId = activeAccount?.homeAccountId ?? null;
  const idTokenClaims = activeAccount?.idTokenClaims as TokenClaims | undefined;
  const accountRoles = getRolesFromClaims(idTokenClaims);
  const [renewedRoles, setRenewedRoles] = useState<{
    accountId: string;
    roles: string[];
  } | null>(null);
  const [renewal, setRenewal] = useState<{
    accountId: string | null;
    status: 'idle' | 'renewing' | 'done';
  }>({ accountId: null, status: 'idle' });

  const renewalState = renewal.accountId === accountId ? renewal.status : 'idle';
  const cachedRenewedRoles =
    renewedRoles?.accountId === accountId ? renewedRoles.roles : undefined;
  const roles = accountRoles ?? cachedRenewedRoles;

  useEffect(() => {
    const checkAndRenewRoles = async () => {
      if (inProgress !== InteractionStatus.None) return;
      if (!activeAccount || !accountId || roles !== undefined || renewalState !== 'idle') return;

      setRenewal({ accountId, status: 'renewing' });
      console.info('No se encontraron roles en la sesión. Recuperando permisos silenciosamente...');

      try {
        const tokenResponse = await instance.acquireTokenSilent({
          scopes: ['openid', 'profile'],
          account: activeAccount,
          forceRefresh: true,
        });
        const refreshedRoles = getRolesFromClaims(tokenResponse.idTokenClaims);

        if (refreshedRoles !== undefined) {
          setRenewedRoles({ accountId, roles: refreshedRoles });
        } else {
          console.warn('La renovación de sesión no devolvió roles en el token.');
        }
      } catch (error) {
        console.warn('Falló la renovación silenciosa. Redirigiendo a inicio de sesión...', error);
        try {
          await instance.loginRedirect();
        } catch (redirectError) {
          console.error('No se pudo redirigir al inicio de sesión:', redirectError);
        }
      } finally {
        setRenewal({ accountId, status: 'done' });
      }
    };

    void checkAndRenewRoles();
  }, [inProgress, activeAccount, accountId, roles, renewalState, instance]);

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

  const finalRoles = activeAccount ? (roles ?? []) : [];
  const claimName = idTokenClaims?.name;
  const fullName = activeAccount
    ? activeAccount.name || (typeof claimName === 'string' ? claimName : 'Usuario')
    : '';

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
    <AuthContext.Provider
      value={{
        fullName,
        initials,
        roles: finalRoles,
        primaryRole,
        isAdmin,
        isRecepcionista,
        isHuesped,
        isAuditor,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// This hook intentionally lives beside its provider to expose the context API.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};