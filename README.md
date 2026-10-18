# VidaSalud Frontend

Frontend de VidaSalud construido con Angular 18. Publicado en **https://e7u1iiqh4k.execute-api.us-east-1.amazonaws.com**.

Los pacientes se registran e inician sesión con Microsoft Entra ID, agendan horas viendo la disponibilidad real y siguen en vivo cómo avanza su cita. Recepción y administración supervisan todas las citas en tiempo real. Todo el backend se consume a través de AWS API Gateway, enviando el JWT en cada llamada.

Matriz de funcionalidades y documentación del proyecto: [vidasalud-docs](https://github.com/effimrv/vidasalud-docs).

## Tecnologías

- Angular 18 (componentes standalone) y TypeScript.
- MSAL Angular y MSAL Browser para OAuth 2.0 / OpenID Connect con Microsoft Entra ID.
- RxJS y `HttpClient` para consumir el backend.
- Jasmine y Karma para las pruebas.

## Funcionalidades

**Autenticación**
- Registro de pacientes (botón *Crear cuenta*, flujo de autoservicio de Entra ID) e inicio y cierre de sesión.
- Vistas privadas protegidas con `MsalGuard`.
- `MsalInterceptor` adjunta y renueva el token Bearer en cada llamada al backend; las llamadas esperan a que MSAL termine cualquier interacción en curso.
- Mensajes claros cuando el login o el registro se cancelan o fallan, y cuando la API responde con error (sin conexión, sesión expirada, sin permisos, servicio no disponible).

**Paciente**
- Agenda con horas ocupadas (reservadas, bloqueadas, pasadas o domingos) que se actualiza mientras el paciente elige.
- Seguimiento en vivo de cada cita con una barra de progreso y avisos cuando cambia de estado.
- Pestañas *Próximas*, *Finalizadas* y *Canceladas*, detalle con historial, cancelación de citas propias e informe médico de ejemplo en las atenciones finalizadas.

**Recepción y administración**
- Tabla de todas las citas actualizada cada 5 segundos, con filtros por estado, búsqueda y detalle de cada cita (paciente, correo, prestación, box, fecha e historial).
- Administración: gestión de especialidades y precios, métricas, supervisión e información del centro.

La vista se elige según el rol que trae el token (`Admin`, `Recepcionista` o `Paciente`).

## Instalación y ejecución local

Requisitos: Node.js 20 y npm. Usa el backend desplegado en la nube.

```bash
npm install
npm start -- --port 4201
```

Luego abre `http://localhost:4201`. El puerto debe ser 4201: es la URI de redirección registrada en Entra ID para desarrollo local.

## Compilación y pruebas

```bash
npm run build
npm test
```

La compilación genera los archivos en `dist/`.

## Estructura principal

```text
src/app/
  auth.config.ts       Identificadores de Entra ID, scope y URL del API Gateway
  app.config.ts        Configuración de MSAL, interceptor y rutas protegidas
  app.routes.ts        Rutas de la aplicación
  api.service.ts       Llamadas al backend e interfaces de datos
  home/                Página de inicio pública
  about/               Página Nosotros
  appointments/        Portal: vistas de paciente y recepción
  admin/               Panel de administración
  shared/              Detalle y progreso de cita, formato, mensajes de error, informes de ejemplo
```

## API utilizada

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/me` | Nombre, nombre completo y roles del usuario |
| GET | `/api/appointments` | Citas (el paciente recibe solo las suyas) |
| GET | `/api/appointments/{id}` | Detalle de una cita con su historial |
| GET | `/api/appointments/disponibilidad` | Horas disponibles de una prestación en un día |
| POST | `/api/appointments` | Agendar una cita |
| PUT | `/api/appointments/{id}/status` | Cancelar una cita |
| GET / POST / PUT | `/api/catalog/services` | Prestaciones (crear y editar: solo Admin) |
| GET / PUT | `/api/info` | Información del centro (lectura pública, edición solo Admin) |

No se deben publicar secretos, contraseñas ni tokens en este repositorio.

## Despliegue con Docker

`Dockerfile` compila Angular en modo producción y lo sirve con nginx (`nginx.conf`). Todas las rutas de Angular responden `index.html`, e `index.html` no se guarda en caché.

```bash
docker build -t vidasalud-frontend .
docker run -d --name frontend -p 80:80 vidasalud-frontend
```

En la nube se levanta desde el repo `vidasalud-infra` (servicio `frontend`) en la EC2, con un API Gateway delante para HTTPS: **https://e7u1iiqh4k.execute-api.us-east-1.amazonaws.com**
