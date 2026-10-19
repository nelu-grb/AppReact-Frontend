# AndesStay — Frontend

Aplicación web para gestionar la operación de alojamientos: reservas, catálogo de unidades, reportes y auditoría. La interfaz se conecta a una API y adapta las secciones disponibles según el rol de la persona usuaria.

## Qué incluye

- **Panel:** resumen de la actividad y acceso a las secciones.
- **Reservas:** consulta y gestión de reservas, cambios de estado y flujo de pago.
- **Catálogo:** consulta y administración de unidades de alojamiento.
- **Reportes:** indicadores y actividad de reservas.
- **Auditoría:** consulta de eventos para seguimiento operativo.
- **Acceso y pagos:** inicio de sesión con Microsoft Entra ID y retorno del flujo de pago Webpay.

El acceso a las secciones se controla por rol: las reservas están disponibles para Admin, Recepcionista y Huésped; el catálogo para Admin y Recepcionista; los reportes para Admin; y la auditoría para Admin y Auditor.

## Tecnologías

React 19, TypeScript, Vite, React Router, Tailwind CSS, MSAL para autenticación y Axios para las solicitudes a la API.

## Empezar

Requisitos: Node.js y npm.

```bash
npm install
npm run dev
```

Antes de iniciar la aplicación, configura en un archivo `.env.local` las variables de entorno requeridas:

| Variable | Uso |
| --- | --- |
| `VITE_AZURE_CLIENT_ID` | Identificador de la aplicación registrada en Microsoft Entra ID. |
| `VITE_AZURE_TENANT_ID` | Identificador del tenant de autenticación. |
| `VITE_API_BASE_URL` | URL base de la API. |
| `VITE_API_SCOPE` | Scope que solicita el cliente para acceder a la API. |

La URL de redirección de autenticación se obtiene del origen desde el que se ejecuta la aplicación. Asegúrate de que ese origen esté registrado en la configuración de Entra ID. No incluyas secretos en variables `VITE_*`: Vite las expone en el cliente.

## Comandos

```bash
npm run dev      # servidor local
npm run build    # compilación de producción
npm run preview  # vista previa de la compilación
npm run lint     # revisión de ESLint
```

## Estructura

```text
src/
  components/  elementos compartidos y estructura de navegación
  config/      configuración de autenticación y API
  context/     estado de autenticación y roles
  hooks/       hooks reutilizables
  pages/       pantallas de la aplicación
  services/    comunicación con API y servicios de pago
  utils/       formato y manejo de estados y errores
```

Las rutas y sus restricciones por rol se definen en `src/App.tsx`; la integración de autenticación y API se configura en `src/config/`.
