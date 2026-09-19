import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { ESPECIALIDADES } from '../shared/especialidades';
import { ApiService, InstitutionalInfo } from '../api.service';

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

      <!-- Lado visual del Hero con logo institucional y tarjeta flotante -->
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-emblem">
          <div class="emblem-ring ring-outer"></div>
          <div class="emblem-ring ring-inner"></div>
          <img src="logo.png" alt="Logo VidaSalud" class="emblem-logo" />
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

    <!-- Tarjeta de accesos rápidos -->
    <div class="quick-access-wrap">
      <div class="quick-access-card reveal">
        <a class="quick-access-item" routerLink="/appointments">
          <span class="qa-icon" aria-hidden="true">📅</span>
          <span class="qa-text"><strong>Agendar hora</strong><small>Elige tu especialidad y reserva</small></span>
        </a>
        <span class="qa-divider" aria-hidden="true"></span>
        <a class="quick-access-item" routerLink="/appointments">
          <span class="qa-icon" aria-hidden="true">🗂️</span>
          <span class="qa-text"><strong>Mis atenciones</strong><small>Revisa el estado de tus citas</small></span>
        </a>
        <span class="qa-divider" aria-hidden="true"></span>
        <a class="quick-access-item" routerLink="/" fragment="especialidades">
          <span class="qa-icon" aria-hidden="true">📋</span>
          <span class="qa-text"><strong>Especialidades</strong><small>Conoce valores y boxes</small></span>
        </a>
      </div>
    </div>

    <!-- Sección: ¿Cómo funciona VidaSalud? -->
    <section class="how-it-works">
      <div class="section-title-wrap reveal">
        <span class="eyebrow">PASO A PASO</span>
        <h2>¿Cómo funciona nuestra plataforma?</h2>
        <p>Accede a tus servicios médicos en tres pasos sencillos y sin trámites complejos.</p>
      </div>

      <div class="feature-grid">
        <article class="feature-card feature-card-highlight reveal">
          <span class="feature-icon">01</span>
          <div>
            <h2>Acceso Unificado</h2>
            <p>Ingresa con tu cuenta institucional o personal de Microsoft Entra ID de manera segura y sin memorizar claves extra.</p>
          </div>
        </article>
        <article class="feature-card reveal">
          <span class="feature-icon icon-teal">02</span>
          <div>
            <h2>Reserva y Catálogo</h2>
            <p>Elige tu prestación médica, conoce el valor de la consulta y reserva de forma inmediata en los boxes habilitados.</p>
          </div>
        </article>
        <article class="feature-card reveal">
          <span class="feature-icon icon-coral">03</span>
          <div>
            <h2>Seguimiento en Vivo</h2>
            <p>Monitorea el avance de tu atención desde la solicitud y sala de espera hasta la consulta médica presencial.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- Sección: Comprometidos con tu salud (Showcase visual) -->
    <section class="showcase-section">
      <div class="section-title-wrap reveal">
        <span class="eyebrow">NUESTRA ATENCIÓN</span>
        <h2>Comprometidos con tu salud, en cada etapa</h2>
        <p>Un equipo clínico real, presente en la prevención, el control y el seguimiento de cada paciente.</p>
      </div>

      <div class="showcase-grid">
        <article class="showcase-card showcase-card-tall reveal">
          <img src="img-vacunacion.jpg" alt="Médico aplicando una vacuna a una paciente en sala de espera" loading="lazy" />
          <div class="showcase-overlay">
            <span class="showcase-tag">Prevención</span>
            <h3>Vacunación y controles preventivos</h3>
          </div>
        </article>

        <article class="showcase-card reveal">
          <img src="img-monitoreo.jpg" alt="Médico con estetoscopio revisando signos vitales desde un dispositivo móvil" loading="lazy" />
          <div class="showcase-overlay">
            <span class="showcase-tag">Monitoreo</span>
            <h3>Control cardiovascular conectado</h3>
          </div>
        </article>
      </div>
    </section>

    <!-- Sección: Especialidades Clínicas Destacadas -->
    <section class="specialties-section" id="especialidades">
      <div class="section-title-wrap reveal">
        <span class="eyebrow">PRESTACIONES CLÍNICAS</span>
        <h2>Especialidades Médicas Disponibles</h2>
        <p>Profesionales capacitados para el cuidado de tu salud y la de tu familia.</p>
      </div>

      <div class="specialties-grid">
        <article class="spec-card reveal" *ngFor="let esp of especialidades" [id]="esp.slug">
          <img [src]="esp.imagen" [alt]="esp.nombre" class="spec-card-img" loading="lazy" />
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
      <div *ngIf="!logueada" class="cta-banner reveal">
        <img src="img-telemedicina.jpg" alt="" class="cta-banner-img" aria-hidden="true" />
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

    <!-- Sección: Información de VidaSalud (editable por el Admin) -->
    <section class="info-section" id="quienes-somos" *ngIf="infoInstitucional">
      <div class="section-title-wrap">
        <span class="eyebrow">QUIÉNES SOMOS</span>
        <h2>{{ infoInstitucional.titulo }}</h2>
      </div>
      <div class="info-card">
        <p class="info-desc">{{ infoInstitucional.descripcion }}</p>
        <div class="info-details">
          <div class="info-detail-item">
            <strong>📍 Dirección</strong>
            <span>{{ infoInstitucional.direccion }}</span>
          </div>
          <div class="info-detail-item">
            <strong>🕒 Horario</strong>
            <span>{{ infoInstitucional.horario }}</span>
          </div>
          <div class="info-detail-item">
            <strong>☎️ Teléfono</strong>
            <span>{{ infoInstitucional.telefono }}</span>
          </div>
          <div class="info-detail-item">
            <strong>✉️ Email</strong>
            <span>{{ infoInstitucional.email }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer Institucional -->
    <footer class="clinic-footer">
      <div class="footer-content">
        <div>
          <div class="brand brand-footer">
            <img src="logo.png" alt="Logo VidaSalud" class="brand-img" />
            <span>VidaSalud</span>
          </div>
          <p class="footer-desc">Red de atención clínica, salud digital y gestión médica integral.</p>
        </div>
        <div class="footer-info">
          <div id="horario">
            <strong>Horario de Atención</strong>
            <p>Lunes a Viernes: 08:00 - 20:00 hrs<br>Sábados: 09:00 - 14:00 hrs</p>
          </div>
          <div id="seguridad">
            <strong>Seguridad Institucional</strong>
            <p>Plataforma protegida con Microsoft Entra ID y cifrado de datos clínicos.</p>
          </div>
          <div id="contacto">
            <strong>Contacto</strong>
            <p>600 360 7777<br>contacto&#64;vidasalud.cl</p>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <small>© 2026 VidaSalud. Todos los derechos reservados · Plataforma de Servicios Clínicos</small>
      </div>
    </footer>
  `
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;

  especialidades = ESPECIALIDADES;
  infoInstitucional: InstitutionalInfo | null = null;

  constructor(
    private msal: MsalService,
    private host: ElementRef<HTMLElement>,
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.api.getInfoInstitucional().subscribe({
      next: info => this.infoInstitucional = info,
      error: err => console.warn('No se pudo cargar la información institucional:', err)
    });
  }

  ngAfterViewInit(): void {
    const elementos = this.host.nativeElement.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      elementos.forEach(el => el.classList.add('in-view'));
    } else {
      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              this.observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
      );

      elementos.forEach(el => this.observer?.observe(el));
    }

    this.route.fragment.subscribe(fragment => this.manejarFragmento(fragment));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private manejarFragmento(fragment: string | null): void {
    if (!fragment || !this.especialidades.some(e => e.slug === fragment)) return;

    requestAnimationFrame(() => {
      const el = this.host.nativeElement.querySelector(`#${fragment}`);
      if (!el) return;
      el.classList.add('pulse-highlight');
      setTimeout(() => el.classList.remove('pulse-highlight'), 1800);
    });
  }

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
