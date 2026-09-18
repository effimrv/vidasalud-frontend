import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Si la página se abre o recarga con un #fragmento "viejo" en la URL (por ejemplo, tras usar
// el buscador o el mega-menú en una visita anterior), lo quitamos antes de arrancar Angular
// para que la carga inicial siempre empiece arriba, sin saltos automáticos inesperados.
//
// OJO: Microsoft Entra ID devuelve la respuesta del login (código de autorización) también
// como un #fragmento para apps SPA (ej: "#code=...&state=...&session_state=..."), y MSAL
// necesita leer ese fragmento en handleRedirectPromise() al iniciar Angular. Por eso NUNCA
// hay que borrar el fragmento a ciegas: solo limpiamos el que claramente NO es una respuesta
// de autenticación (si lo fuera, borrarlo aquí perdería el login en silencio, sin errores).
const fragmentoUrl = window.location.hash;
const pareceRespuestaDeLogin = /(^#|[?&])(code|error|state|session_state|id_token)=/.test(fragmentoUrl);
if (fragmentoUrl && !pareceRespuestaDeLogin) {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
