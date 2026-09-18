import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';

interface EspecialidadDestacada {
  nombre: string;
  descripcion: string;
  precio: string;
  box: string;
  icono: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <!-- Hero Principal -->
    <section class="hero-panel">
      <div class="hero-copy">
        <span class="eyebrow">RED DE SALUD INTEGRAL · VIDA SALUD</span>
        <h1>Atención médica más humana, ágil y conectada.</h1>
        <p>
          Gestiona tus consultas médicas, agenda horas con nuestros especialistas y realiza
          el seguimiento de tus atenciones en un entorno clínico moderno y seguro.
        </p>

        <!-- CTA cuando está logueado -->
        <div *ngIf="logueada; else noLogueado" class="hero-logged-area">
          <div class="user-pill-hero">
            <span class="user-dot"></span>
            <span>Sesión activa como <strong>{{ nombreUsuario }}</strong> ({{ esAdmin ? 'Administrador' : 'Paciente' }})</span>
          </div>
          <a class="button button-primary" routerLink="/appointments">
            {{ esAdmin ? 'Ir al Panel Operativo de la Clínica' : 'Ver mis atenciones y agendar hora' }}
            <span class="button-arrow" aria-hidden="true">&#8594;</span>
          </a>
        </div>

        <!-- CTA cuando NO está logueado (Acceso único, claro y destacado) -->
        <ng-template #noLogueado>
          <div class="hero-cta-wrapper">
            <button class="button button-hero-login" (click)="login()">
              <span class="microsoft-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              <div class="cta-text">
                <span class="cta-title">Ingresar con Microsoft Entra ID</span>
                <span class="cta-sub">Acceso para pacientes y funcionarios de salud</span>
              </div>
              <span class="cta-arrow" aria-hidden="true">&#8594;</span>
            </button>
            <div class="hero-trust-badges">
              <span><i class="check-icon">&#10003;</i> Citas 100% en línea</span>
              <span><i class="check-icon">&#10003;</i> Sin claves adicionales</span>
              <span><i class="check-icon">&#10003;</i> Datos médicos protegidos</span>
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Lado visual del Hero con tarjeta flotante clínica -->
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-orbit">
          <div class="orbit-ring ring-one"></div>
          <div class="orbit-ring ring-two"></div>
          <div class="health-symbol">+</div>
        </div>
        <div class="hero-badge-card">
          <div class="badge-card-header">
            <span class="live-dot"></span>
            <span>Centro Médico Activo</span>
          </div>
          <strong>Consultas Disponibles Hoy</strong>
          <small>Medicina General · Kinesiología · Pediatría</small>
        </div>
      </div>
    </section>

    <!-- Sección: ¿Cómo funciona VidaSalud? -->
    <section class="how-it-works">
      <div class="section-title-wrap">
        <span class="eyebrow">PASO A PASO</span>
        <h2>¿Cómo funciona nuestra plataforma?</h2>
        <p>Accede a tus servicios médicos en tres pasos sencillos y sin trámites complejos.</p>
      </div>

      <div class="feature-grid">
        <article class="feature-card feature-card-highlight">
          <span class="feature-icon">01</span>
          <div>
            <h2>Acceso Unificado</h2>
            <p>Ingresa con tu cuenta institucional o personal de Microsoft Entra ID de manera segura y sin memorizar claves extra.</p>
          </div>
        </article>
        <article class="feature-card">
          <span class="feature-icon icon-teal">02</span>
          <div>
            <h2>Reserva y Catálogo</h2>
            <p>Elige tu prestación médica, conoce el valor de la consulta y reserva de forma inmediata en los boxes habilitados.</p>
          </div>
        </article>
        <article class="feature-card">
          <span class="feature-icon icon-coral">03</span>
          <div>
            <h2>Seguimiento en Vivo</h2>
            <p>Monitorea el avance de tu atención desde la solicitud y sala de espera hasta la consulta médica presencial.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- Sección: Especialidades Clínicas Destacadas -->
    <section class="specialties-section">
      <div class="section-title-wrap">
        <span class="eyebrow">PRESTACIONES CLÍNICAS</span>
        <h2>Especialidades Médicas Disponibles</h2>
        <p>Profesionales capacitados para el cuidado de tu salud y la de tu familia.</p>
      </div>

      <div class="specialties-grid">
        <article class="spec-card" *ngFor="let esp of especialidades">
          <div class="spec-icon-wrap">{{ esp.icono }}</div>
          <div class="spec-info">
            <div class="spec-top">
              <h3>{{ esp.nombre }}</h3>
              <span class="spec-price">{{ esp.precio }}</span>
            </div>
            <p>{{ esp.descripcion }}</p>
            <div class="spec-meta">
              <span>📍 {{ esp.box }}</span>
              <span class="spec-badge">✓ Cupos disponibles</span>
            </div>
          </div>
        </article>
      </div>

      <!-- Banner de invitación a ingresar si no está logueado -->
      <div *ngIf="!logueada" class="cta-banner">
        <div class="cta-banner-text">
          <h3>¿Necesitas agendar alguna de estas atenciones?</h3>
          <p>Identifícate con tu cuenta Microsoft para acceder de inmediato a la reserva de horas y tus citas médicas.</p>
        </div>
        <button class="button button-hero-login-sm" (click)="login()">
          <span class="microsoft-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span>Iniciar sesión para reservar</span>
          <span aria-hidden="true">&#8594;</span>
        </button>
      </div>
    </section>

    <!-- Footer Institucional -->
    <footer class="clinic-footer">
      <div class="footer-content">
        <div>
          <div class="brand brand-footer">
            <span class="brand-mark">V</span>
            <span>VidaSalud</span>
          </div>
          <p class="footer-desc">Red de atención clínica, salud digital y gestión médica integral.</p>
        </div>
        <div class="footer-info">
          <div>
            <strong>Horario de Atención</strong>
            <p>Lunes a Viernes: 08:00 - 20:00 hrs<br>Sábados: 09:00 - 14:00 hrs</p>
          </div>
          <div>
            <strong>Seguridad Institucional</strong>
            <p>Plataforma protegida con Microsoft Entra ID y cifrado de datos clínicos.</p>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <small>© 2026 VidaSalud. Todos los derechos reservados · Plataforma de Servicios Clínicos</small>
      </div>
    </footer>
  `
})
export class HomeComponent {
  especialidades: EspecialidadDestacada[] = [
    {
      nombre: 'Medicina General',
      descripcion: 'Evaluación clínica integral, diagnósticos preventivos y tratamiento de patologías frecuentes.',
      precio: '$15.000',
      box: 'Box 1',
      icono: '🩺'
    },
    {
      nombre: 'Pediatría y Control Niño Sano',
      descripcion: 'Atención especializada para recién nacidos, niños y adolescentes con enfoque preventivo.',
      precio: '$22.000',
      box: 'Box 2',
      icono: '👶'
    },
    {
      nombre: 'Kinesiología y Rehabilitación',
      descripcion: 'Recuperación funcional motora, terapia respiratoria y tratamiento músculo-esquelético.',
      precio: '$18.000',
      box: 'Box 3',
      icono: '🏃'
    },
    {
      nombre: 'Cardiología Preventiva',
      descripcion: 'Chequeos cardiovasculares, control de hipertensión y evaluaciones médicas de esfuerzo.',
      precio: '$28.000',
      box: 'Box 4',
      icono: '❤️'
    }
  ];

  constructor(private msal: MsalService) {}

  get logueada(): boolean {
    return this.msal.instance.getAllAccounts().length > 0;
  }

  get nombreUsuario(): string {
    const cuenta = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
    return cuenta ? (cuenta.name ?? cuenta.username) : 'Usuario';
  }

  get roles(): string[] {
    const cuenta = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
    if (cuenta?.idTokenClaims && 'roles' in cuenta.idTokenClaims) {
      return (cuenta.idTokenClaims as any).roles || [];
    }
    return [];
  }

  get esAdmin(): boolean {
    return this.roles.some(r => r === 'Admin' || r === 'Recepcionista');
  }

  login(): void {
    this.msal.loginRedirect();
  }
}
