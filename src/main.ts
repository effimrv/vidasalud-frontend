import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Si la página se abre o recarga con un #fragmento en la URL (por ejemplo, tras usar
// el buscador o el mega-menú en una visita anterior), lo quitamos antes de arrancar Angular
// para que la carga inicial siempre empiece arriba, sin saltos automáticos inesperados.
if (window.location.hash) {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
