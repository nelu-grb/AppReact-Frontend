import { createContext, useContext, type ReactNode, useEffect, useState, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';

// 1. Tipado de los datos que compartirá el contexto
interface AuthContextType {
  fullName: string;
  userEmail: string;
  initials: string;
  roles: string[];
  primaryRole: string;
  isAdmin: boolean;
  isRecepcionista: boolean;
  isHuesped: boolean;
  isAuditor: boolean;
  hasAnyRole: (allowedRoles: string[]) => boolean;
  rolesLoading: boolean;
}

type TokenClaims = Record<string, unknown>;

/**
 * Función exhaustiva para extraer los roles de cualquier propiedad o esquema de Azure AD
 */
function extractRolesFromClaims(claims: TokenClaims | undefined): string[] {
  if (!claims) return [];

  const directRoles = [claims.roles, claims.role, claims.app_roles]
    .flatMap((value) => {
      if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
      if (typeof value === 'string') return [value];
      return [];
    });

  const claimRole = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (Array.isArray(claimRole)) {
    directRoles.push(...claimRole.filter((item): item is string => typeof item === 'string'));
  } else if (typeof claimRole === 'string') {
    directRoles.push(claimRole);
  }

  return [...new Set(directRoles.map((role) => role.trim()).filter(Boolean))];
}

/**
 * Decodifica la sección payload de un token JWT
 */
function decodeJwtPayload(token: string): TokenClaims {
  try {
    const base64Payload = token.split('.')[1];
    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

/**
 * Extrae el correo de la cuenta desde los claims del token, replicando el orden
 * que usa el backend (email -> preferred_username -> upn -> unique_name).
 */
function extractEmailFromClaims(claims: TokenClaims | undefined, fallback?: string): string {
  if (claims) {
    for (const key of ['email', 'preferred_username', 'upn', 'unique_name']) {
      const value = claims[key];
      if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }
  }
  return fallback ?? '';
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { accounts, instance, inProgress } = useMsal();
  const activeAccount = instance.getActiveAccount() ?? (accounts.length > 0 ? accounts[0] : null);
  const accountId = activeAccount?.homeAccountId ?? null;
  const idTokenClaims = activeAccount?.idTokenClaims as TokenClaims | undefined;

  // Extraemos los roles de los claims de la cuenta activa
  const accountRoles = useMemo(() => extractRolesFromClaims(idTokenClaims), [idTokenClaims]);

  const [renewedRoles, setRenewedRoles] = useState<{ accountId: string; roles: string[] } | null>(null);
  const [renewal, setRenewal] = useState<{ accountId: string | null; status: 'idle' | 'renewing' | 'done' }>({
    accountId: null,
    status: 'idle',
  });

  const renewalState = renewal.accountId === accountId ? renewal.status : 'idle';
  const cachedRenewedRoles = renewedRoles?.accountId === accountId ? renewedRoles.roles : undefined;
  
  // Si no hay roles en idTokenClaims ni en cache, roles será undefined para activar la búsqueda
  const roles = (accountRoles.length > 0 ? accountRoles : undefined) ?? cachedRenewedRoles;

  // true mientras MSAL o la recuperación de roles siguen en curso
  const rolesLoading =
    activeAccount !== null &&
    (
      inProgress !== InteractionStatus.None ||
      renewalState === 'renewing' ||
      (roles === undefined && renewalState === 'idle')
    );

  useEffect(() => {
    const checkAndRenewRoles = async () => {
      if (inProgress !== InteractionStatus.None) return;
      if (!activeAccount || !accountId || roles !== undefined || renewalState !== 'idle') return;


      try {
        const tokenResponse = await instance.acquireTokenSilent({
          scopes: ['openid', 'profile'],
          account: activeAccount,
          forceRefresh: false, // Cambiado a false para evitar peticiones repetitivas
        });

        // Buscamos roles tanto en el ID Token como en el Access Token
        const idTokenRoles = extractRolesFromClaims(decodeJwtPayload(tokenResponse.idToken));
        const accessTokenRoles = extractRolesFromClaims(decodeJwtPayload(tokenResponse.accessToken));
        const combined = [...new Set([...idTokenRoles, ...accessTokenRoles])];

        // Guardamos el resultado (incluso si es [], para romper el bucle)
        setRenewedRoles({ accountId, roles: combined });
      } catch (error) {
        console.warn('No se pudieron recuperar roles adicionals. Asignando lista vacía.', error);
        setRenewedRoles({ accountId, roles: [] });
      } finally {
        setRenewal({ accountId, status: 'done' });
      }
    };

    void checkAndRenewRoles();
  }, [inProgress, activeAccount, accountId, roles, renewalState, instance]);

  const finalRoles = activeAccount ? (roles ?? accountRoles) : [];
  const claimName = idTokenClaims?.name;
  const fullName = activeAccount
    ? activeAccount.name || (typeof claimName === 'string' ? claimName : 'Usuario')
    : '';
  const userEmail = extractEmailFromClaims(idTokenClaims, activeAccount?.username);

  const nameParts = fullName.trim().split(' ').filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase() || 'US';

  // Unificamos el vocabulario de roles entre frontend y backend.
  // Los microservicios usan nombres en inglés (RECEPTIONIST, AUDIT, GUEST, ...)
  // mientras que la UI usa nombres en español (Recepcionista, Auditor, Huésped, ...).
  // Canonicalizamos ambos a un valor común para que los guards funcionen siempre.
  const ROLE_ALIASES: Record<string, string> = {
    administrador: 'admin',
    administrator: 'admin',
    receptionist: 'recepcionista',
    recepcion: 'recepcionista',
    operador: 'recepcionista',
    operator: 'recepcionista',
    audit: 'auditor',
    auditoria: 'auditor',
    guest: 'huesped',
    guest_user: 'huesped',
    guestuser: 'huesped',
  };

  const normalizeRole = (role: string) => {
    const base = role.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return ROLE_ALIASES[base] ?? base;
  };

  const normalizedRoles = finalRoles.map(normalizeRole);
  const isAdmin = normalizedRoles.includes('admin');
  const isRecepcionista = normalizedRoles.includes('recepcionista');
  const isHuesped = normalizedRoles.includes('huesped');
  const isAuditor = normalizedRoles.includes('auditor');

  const primaryRole =
    isAdmin ? 'ADMIN' :
    isRecepcionista ? 'RECEPCIONISTA' :
    isAuditor ? 'AUDITOR' :
    isHuesped ? 'HUÉSPED' :
    'USUARIO';

  // TEMPORAL: log de verificación de roles extraídos del token (quitar cuando ya no haga falta)
  const rolesDebugKey = `${finalRoles.join('|')}::${normalizedRoles.join('|')}`;
  useEffect(() => {
    if (!activeAccount) {
      console.log('[Auth] Sin cuenta activa: no hay roles para extraer.');
      return;
    }
    console.log(
      `[Auth] Rol(es) extraído(s) del token para ${activeAccount.username ?? 'usuario'}: ` +
      JSON.stringify({
        crudos: finalRoles.length > 0 ? finalRoles : '(vacío: el token no trae claim de roles)',
        normalizados: normalizedRoles,
        rolPrincipal: primaryRole,
        fuente:
          accountRoles.length > 0
            ? 'ID token'
            : cachedRenewedRoles
              ? 'access token (renovado)'
              : 'el token no trae roles',
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, rolesDebugKey, primaryRole]);

  const hasAnyRole = (allowedRoles: string[]): boolean => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    return normalizedRoles.some((role) => normalizedAllowed.includes(role));
  };

  return (
    <AuthContext.Provider
      value={{
        fullName,
        userEmail,
        initials,
        roles: finalRoles,
        primaryRole,
        isAdmin,
        isRecepcionista,
        isHuesped,
        isAuditor,
        hasAnyRole,
        rolesLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};