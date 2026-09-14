import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <h1>Plataforma VidaSalud</h1>
    <p>Gestion de atenciones para centros de salud.</p>
    <p>Inicia sesion con tu cuenta Microsoft para ver las atenciones.</p>
  `
})
export class HomeComponent {}
