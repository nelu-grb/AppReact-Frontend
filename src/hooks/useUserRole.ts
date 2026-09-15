import { useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';

function extractRoles(claims: Record<string, unknown> | undefined): string[] {
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

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Payload = token.split('.')[1];
    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

export function useUserRole() {
  const { accounts, instance } = useMsal();
  const activeAccount = accounts[0];
  const [roles, setRoles] = useState<string[]>(() => extractRoles(activeAccount?.idTokenClaims as Record<string, unknown> | undefined));
  const [rolesLoading, setRolesLoading] = useState(Boolean(activeAccount));

  useEffect(() => {
    let cancelled = false;

    const hydrateRoles = async () => {
      if (!activeAccount) {
        setRoles([]);
        setRolesLoading(false);
        return;
      }

      setRolesLoading(true);
      const claimsFromAccount = extractRoles(activeAccount.idTokenClaims as Record<string, unknown> | undefined);

      try {
        const tokenResponse = await instance.acquireTokenSilent({
          account: activeAccount,
          scopes: loginRequest.scopes,
        });

        if (cancelled) return;

        const idTokenRoles = extractRoles(decodeJwtPayload(tokenResponse.idToken));
        const accessTokenRoles = extractRoles(decodeJwtPayload(tokenResponse.accessToken));
        setRoles([...new Set([...claimsFromAccount, ...idTokenRoles, ...accessTokenRoles])]);
      } catch {
        if (!cancelled) {
          setRoles(claimsFromAccount);
        }
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    };

    hydrateRoles();

    return () => {
      cancelled = true;
    };
  }, [activeAccount, instance]);

  const idTokenClaims = activeAccount?.idTokenClaims as Record<string, unknown> | undefined;
  const fullName: string = activeAccount?.name || (typeof idTokenClaims?.name === 'string' ? idTokenClaims.name : '') || 'Usuario';
  const email = activeAccount?.username || (typeof idTokenClaims?.preferred_username === 'string' ? idTokenClaims.preferred_username : '');

  const nameParts = fullName.trim().split(' ');
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase() || 'US';

  const lowerRoles = useMemo(() => roles.map((r) => r.toLowerCase()), [roles]);
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
    email,
    initials,
    roles,
    rolesLoading,
    primaryRole,
    isAdmin,
    isRecepcionista,
    isHuesped,
    isAuditor,
    hasAnyRole,
  };
}