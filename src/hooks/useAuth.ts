import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from './authConfig';

export const useAuth = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const login = () => {
    instance.loginRedirect(loginRequest).catch((error) => {
      console.error('Error al iniciar sesión:', error);
    });
  };

  const logout = () => {
    instance.logoutRedirect().catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  };

  const user = accounts[0] || null;

  return {
    isLoggedIn: isAuthenticated,
    user,
    login,
    logout,
  };
};