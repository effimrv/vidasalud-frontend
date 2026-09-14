# VidaSalud Frontend

Frontend de VidaSalud construido con Angular 18. Permite iniciar sesión mediante Microsoft Entra ID, consultar las atenciones y consumir el backend a través de AWS API Gateway.

## Tecnologías

- Angular 18 y TypeScript.
- Angular Router para la navegación.
- MSAL Angular y MSAL Browser para OAuth 2.0 / OpenID Connect.
- RxJS y `HttpClient` para consumir los servicios protegidos.

## Funcionalidades

- Inicio y cierre de sesión con una cuenta Microsoft.
- Protección de la vista de atenciones mediante `MsalGuard`.
- Obtención silenciosa de tokens con `MsalService`.
- Envío del token Bearer mediante `MsalInterceptor`.
- Visualización del usuario, roles y atenciones registradas.

## Instalación y ejecución local

Requisitos: Node.js, npm, una aplicación registrada en Microsoft Entra ID y el backend disponible.

```bash
npm install
npm start -- --host 0.0.0.0 --port 4201
```

Luego abre `http://localhost:4201`. La URI de redirección de MSAL debe coincidir con el puerto utilizado. La configuración está en `src/app/app.config.ts`.

## Compilación y pruebas

```bash
npm run build
npm test
```

La compilación genera los archivos en `dist/`.

## Estructura principal

```text
src/app/
  api.service.ts       Servicio de llamadas autenticadas
  app.config.ts        Configuración de MSAL y HTTP
  app.routes.ts        Rutas y protección de vistas
  appointments/        Vista de atenciones
  home/                Vista principal
```

## API utilizada

La URL del backend se configura en `src/app/api.service.ts` y utiliza `GET /api/me`, `GET /api/appointments` y `GET /api/catalog/services`.

No se deben publicar secretos, contraseñas ni tokens en este repositorio.
