import React from 'react';

interface AsyncStateHandlerProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const AsyncStateHandler: React.FC<AsyncStateHandlerProps> = ({
  loading,
  error,
  isEmpty,
  emptyMessage = 'No se encontraron registros en la base de datos.',
  onRetry,
  children,
}) => {
  // 1. Estado de Carga (Spinner)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm font-medium">Cargando información desde AndesStay...</p>
      </div>
    );
  }

  // 2. Estado de Error
  if (error) {
    return (
      <div className="p-6 my-4 border border-red-200 bg-red-50 rounded-lg text-center">
        <div className="text-red-600 font-semibold mb-1">¡Ocurrió un problema de conexión!</div>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            Reintentar conexión
          </button>
        )}
      </div>
    );
  }

  // 3. Estado Vacío (Sin registros en la Base de Datos)
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-600 font-medium mb-1">{emptyMessage}</p>
        <p className="text-xs text-gray-400">Intenta agregar un nuevo elemento o revisa tus filtros.</p>
      </div>
    );
  }

  // 4. Estado de Éxito (Muestra los datos reales)
  return <>{children}</>;
};