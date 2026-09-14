import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <section class="hero-panel">
      <div class="hero-copy">
        <span class="eyebrow">GESTION CLINICA · VIDA SALUD</span>
        <h1>Una vista clara para cuidar mejor.</h1>
        <p>Centraliza las atenciones de tu centro de salud y mantén cada solicitud en movimiento.</p>
        <a *ngIf="logueada; else iniciarSesion" class="button button-primary" routerLink="/appointments">Ver atenciones <span aria-hidden="true">&#8594;</span></a>
        <ng-template #iniciarSesion><button class="button button-primary" (click)="login()">Iniciar sesión <span aria-hidden="true">&#8594;</span></button></ng-template>
      </div>
      <div class="hero-orbit" aria-hidden="true">
        <div class="orbit-ring ring-one"></div>
        <div class="orbit-ring ring-two"></div>
        <div class="health-symbol">+</div>
      </div>
    </section>

    <section class="feature-grid" aria-label="Resumen de la plataforma">
      <article class="feature-card feature-card-highlight">
        <span class="feature-icon">01</span>
        <div>
          <h2>Atenciones</h2>
          <p>Consulta el estado de cada paciente en un solo lugar.</p>
        </div>
      </article>
      <article class="feature-card">
        <span class="feature-icon icon-teal">02</span>
        <div>
          <h2>Datos conectados</h2>
          <p>Información sincronizada para decisiones más oportunas.</p>
        </div>
      </article>
      <article class="feature-card">
        <span class="feature-icon icon-coral">03</span>
        <div>
          <h2>Acceso seguro</h2>
          <p>Ingresa con tu cuenta institucional de Microsoft.</p>
        </div>
      </article>
    </section>
  `
})
export class HomeComponent {
  constructor(private msal: MsalService) {}

  get logueada(): boolean {
    return this.msal.instance.getAllAccounts().length > 0;
  }

  login(): void {
    this.msal.loginRedirect();
  }
}
