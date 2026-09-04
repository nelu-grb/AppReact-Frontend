import { useMsal } from "@azure/msal-react";

export function useUserRole() {
  const { accounts } = useMsal();
  const activeAccount = accounts[0];

  // Extraer el array de roles del token emitido por Azure AD
  const roles = (activeAccount?.idTokenClaims?.roles as string[]) || [];

  // Extraer nombre completo del usuario
  const fullName = activeAccount?.name || "Usuario AndesStay";

  // Calcular iniciales para el avatar (ej: "Admin Prueba" -> "AP")
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "US";

  // Identificar el rol principal asignado
  const primaryRole = roles[0] || "Sin Rol";

  return {
    fullName,
    initials,
    roles,
    primaryRole,
    isAdmin: roles.includes("Admin"),
    isRecepcionista: roles.includes("Recepcionista"),
    isHuesped: roles.includes("Huesped") || roles.includes("Huésped"),
    isAuditor: roles.includes("Auditor"),
    hasAnyRole: (allowedRoles: string[]) =>
      roles.some((role) => allowedRoles.includes(role)),
  };
}