# AndesStay Frontend

Frontend web de **AndesStay**, una plataforma para administrar unidades de alojamiento, reservas, reportes y auditoria. Esta aplicacion esta construida con React, TypeScript y Vite.

## Funcionalidades

- Inicio de sesion con Microsoft Entra ID/CIAM mediante MSAL.
- Control de acceso por roles: administrador, recepcionista, huesped y auditor.
- Dashboard con datos de catalogo, reservas, reportes y auditoria.
- Gestion de unidades: consultar, crear, editar y eliminar.
- Gestion del ciclo de vida de reservas.
- Consulta de indicadores y exportacion local de reportes CSV.
- Consulta y filtrado de eventos de auditoria.

## Arquitectura y flujo de datos

La aplicacion sigue este flujo:

```text
index.html
  -> src/main.tsx
  -> MSAL y MsalProvider
  -> src/App.tsx y rutas protegidas
  -> pages
  -> services
  -> services/apiClient.ts
  -> API Gateway
  -> backend y base de datos
```

Las paginas no se conectan directamente a la base de datos. Cada pagina llama a un servicio especializado. Los servicios utilizan `apiClient.ts`, que obtiene un access token de MSAL y lo agrega como encabezado `Authorization: Bearer` antes de enviar la solicitud.

## Tecnologias

- React 19
- TypeScript
- Vite
- React Router
- Axios
- `@azure/msal-browser`
- `@azure/msal-react`
- Tailwind CSS
- GitHub Actions
- Azure Static Web Apps

## Requisitos

- Node.js 20 o superior.
- npm.
- Una aplicacion registrada en Microsoft Entra ID/CIAM.
- Acceso al backend y al API Gateway configurado.

## Instalacion y ejecucion local

Desde la raiz del proyecto:

```bash
npm install
npm run dev
```

Vite mostrara la URL local, normalmente `http://localhost:5173`.

Comandos disponibles:

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Compilacion de produccion en dist/
npm run lint      # Validacion ESLint
npm run preview   # Sirve localmente el build de produccion
```

## Autenticacion

La autenticacion esta implementada en:

- `src/main.tsx`: inicializa MSAL, procesa el redirect y monta `MsalProvider`.
- `src/config/authConfig.ts`: define autoridad, client ID, tenant, redirect URI y scopes.
- `src/pages/Login.tsx`: inicia el login con `loginRedirect`.
- `src/hooks/useUserRole.ts`: obtiene y procesa los roles del usuario.

El scope utilizado para acceder a la API es `access_as_user`. El access token debe ser validado nuevamente por el backend. El frontend solo lo utiliza para realizar las solicitudes y controlar la experiencia visual.

## Conexion con el backend

La configuracion principal se encuentra en `src/config/apiConfig.ts` y actualmente utiliza:

```text
https://hyfvjy63q3.execute-api.us-east-1.amazonaws.com
```

Esta URL corresponde a un endpoint de Amazon API Gateway. El frontend consume los siguientes recursos:

| Funcionalidad | Metodo | Endpoint |
|---|---|---|
| Listar unidades | GET | `/api/units` |
| Obtener una unidad | GET | `/api/units/{id}` |
| Crear una unidad | POST | `/api/units` |
| Actualizar una unidad | PUT | `/api/units/{id}` |
| Eliminar una unidad | DELETE | `/api/units/{id}` |
| Listar reservas | GET | `/reservations` |
| Crear reserva | POST | `/reservations` |
| Cambiar estado de reserva | PUT | `/reservations/{id}/status` |
| Consultar KPIs | GET | `/reports/kpis` |
| Consultar auditoria | GET | `/audit` |

La implementacion central esta en `src/services/apiClient.ts`:

1. Busca la cuenta activa de MSAL.
2. Obtiene el token mediante `acquireTokenSilent`.
3. Agrega el token como Bearer.
4. Envia la solicitud con Axios.
5. Maneja respuestas `401` y `403`.

El backend es responsable de validar la firma, el emisor, la audiencia, la expiracion, el scope y los roles del JWT. Las validaciones de React no reemplazan la seguridad del backend.

## Estructura del proyecto

```text
src/
  App.tsx                 # Rutas publicas y protegidas
  main.tsx                # Punto de entrada e inicializacion de MSAL
  index.css               # Estilos globales y Tailwind
  App.css                 # Estilos adicionales
  components/             # Componentes visuales reutilizables
  config/                 # Configuracion de autenticacion y API
  hooks/                  # Hooks de autenticacion, API y roles
  pages/                  # Pantallas principales de la aplicacion
  services/               # Comunicacion con los endpoints del backend
  utils/                  # Manejo de errores, formatos y estados async
```

### Paginas

- `Login.tsx`: autenticacion con Microsoft.
- `Dashboard.tsx`: resumen operacional.
- `Reservations.tsx`: consulta y gestion de reservas.
- `Catalog.tsx`: gestion de unidades.
- `Reports.tsx`: indicadores y exportacion CSV.
- `Audit.tsx`: eventos de auditoria.

### Servicios

- `catalogService.ts`: operaciones del catalogo.
- `reservationService.ts`: operaciones de reservas.
- `reportService.ts`: indicadores de reporteria.
- `auditService.ts`: eventos de auditoria.
- `apiClient.ts`: cliente Axios e inyeccion del token.

## Rutas y roles

| Ruta | Roles permitidos |
|---|---|
| `/login` | Publica |
| `/dashboard` | Cualquier usuario autenticado |
| `/reservations` | Admin, Recepcionista, Huesped |
| `/catalog` | Admin, Recepcionista |
| `/reports` | Admin |
| `/audit` | Admin, Auditor |

El control de rutas se realiza en `src/App.tsx`. El backend debe aplicar las mismas reglas porque ocultar una ruta en el navegador no es una medida de seguridad suficiente.

## Despliegue

El workflow de GitHub Actions esta en `.github/workflows/azure-static-web-apps-ashy-stone-0e63b4a0f.yml`.

Se ejecuta con cambios en la rama `sopia` y realiza:

1. Checkout del repositorio.
2. Instalacion de Node.js 20.
3. `npm install`.
4. `npm run build`.
5. Publicacion de `dist/` mediante `Azure/static-web-apps-deploy@v1`.

`public/staticwebapp.config.json` configura el fallback hacia `index.html`, necesario para que las rutas de React Router funcionen al recargar una URL como `/reservations`.

## Seguridad

El frontend utiliza Microsoft Entra ID/CIAM para autenticar usuarios y MSAL para administrar la sesion. Las solicitudes al backend incluyen un access token en el encabezado `Authorization`.

La autorizacion definitiva debe ser validada por el backend, incluyendo la firma, el emisor, la audiencia, la expiracion, los scopes y los roles del token.
