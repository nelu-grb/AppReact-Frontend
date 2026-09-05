import { useMsal } from '@azure/msal-react';

export function useUserRole() {
  const { accounts } = useMsal();
  const activeAccount = accounts[0];

  const idTokenClaims = activeAccount?.idTokenClaims as {
    roles?: string[];
    name?: string;
    preferred_username?: string;
  } | undefined;

  const roles: string[] = idTokenClaims?.roles || [];
  const fullName: string = activeAccount?.name || idTokenClaims?.name || 'Usuario';

  const nameParts = fullName.trim().split(' ');
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase() || 'US';

  const lowerRoles = roles.map((r) => r.toLowerCase());
  const isAdmin = lowerRoles.includes('admin') || lowerRoles.includes('administrador');
  const isRecepcionista = lowerRoles.includes('recepcionista') || lowerRoles.includes('operador');
  const isHuesped = lowerRoles.includes('huesped') || lowerRoles.includes('huésped');
  const isAuditor = lowerRoles.includes('auditor');

  const primaryRole =
    isAdmin ? 'ADMIN' :
    isRecepcionista ? 'RECEPCIONISTA' :
    isAuditor ? 'AUDITOR' :
    isHuesped ? 'HUÉSPED' : 'USUARIO';

  const hasAnyRole = (allowedRoles: string[]): boolean => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const lowerAllowed = allowedRoles.map((r) => r.toLowerCase());
    return roles.some((r) => lowerAllowed.includes(r.toLowerCase()));
  };

  return {
    fullName,
    initials,
    roles,
    primaryRole,
    isAdmin,
    isRecepcionista,
    isHuesped,
    isAuditor,
    hasAnyRole,
  };
}