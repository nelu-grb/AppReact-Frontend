import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser'; // 1. IMPORTAR ESTO

// Custom hook para obtener el rol del usuario y su información
export function useUserRole() {
  // 2. EXTRAER inProgress
  const { accounts, instance, inProgress } = useMsal(); 
  
  // 3. CREAR VARIABLE BOOLEANA DE CARGA
  const isLoading = inProgress !== InteractionStatus.None;

  const activeAccount = instance.getActiveAccount() ?? (accounts.length === 1 ? accounts[0] : null);

  // Extraer los roles y el nombre completo del usuario desde los claims del token
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

  const normalizeRole = (role: string) =>
    role.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const normalizedRoles = roles.map(normalizeRole);
  const isAdmin = normalizedRoles.includes('admin') || normalizedRoles.includes('administrador');
  const isRecepcionista = normalizedRoles.includes('recepcionista') || normalizedRoles.includes('operador');
  const isHuesped = normalizedRoles.includes('huesped');
  const isAuditor = normalizedRoles.includes('auditor');

  // Determinar el rol principal del usuario según la jerarquía de roles
  const primaryRole =
    isAdmin ? 'ADMIN' :
    isRecepcionista ? 'RECEPCIONISTA' :
    isAuditor ? 'AUDITOR' :
    isHuesped ? 'HUÉSPED' : 
    'Por Defecto'; // Rol por defecto si no se encuentra ninguno 

  const hasAnyRole = (allowedRoles: string[]): boolean => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    return normalizedRoles.some((role) => normalizedAllowed.includes(role));
  };

  // Retornar la información del usuario y sus roles
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
    isLoading, // 4. RETORNAR ESTA VARIABLE PARA USARLA EN TUS COMPONENTES
  };
}