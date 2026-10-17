import { Component, DestroyRef, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, ViewportScroller } from '@angular/common';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AuthenticationResult, EventMessage, EventType, InteractionStatus } from '@azure/msal-browser';
import { filter } from 'rxjs';
import { loginRequest, registroRequest } from './auth.config';
import { describirErrorLogin } from './shared/mensajes-error';
import { ESPECIALIDADES } from './shared/especialidades';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  @ViewChild('megaNav') megaNavRef?: ElementRef<HTMLElement>;

  especialidades = ESPECIALIDADES;
  menuAbierto: string | null = null;
  modoOscuro = false;
  mostrarConfirmacionLogout = false;
  /** Mensaje cuando el login o el registro en Entra ID no terminó bien (cancelado, cuenta no registrada, etc.). */
  errorLogin = '';

  constructor(
    private msal: MsalService,
    private msalBroadcast: MsalBroadcastService,
    private router: Router,
    private viewportScroller: ViewportScroller,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    // Compensa el header fijo (topbar + mega-nav) al hacer scroll a un ancla, ya que Angular
    // calcula la posición manualmente y no respeta scroll-margin-top del CSS.
    this.viewportScroller.setOffset([0, 150]);

    // Procesa la respuesta del redirect de Entra ID (login o renovación interactiva del token).
    this.msal.handleRedirectObservable().subscribe({
      error: err => {
        console.warn('El inicio de sesión no se completó:', err);
        this.errorLogin = describirErrorLogin(err);
      }
    });

    this.msalBroadcast.msalSubject$.pipe(
      filter((msg: EventMessage) =>
        msg.eventType === EventType.LOGIN_SUCCESS || msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((msg: EventMessage) => {
      const resultado = msg.payload as AuthenticationResult;
      this.msal.instance.setActiveAccount(resultado.account);
      this.errorLogin = '';
      if (msg.eventType === EventType.LOGIN_SUCCESS) {
        // Venimos de un login recién completado: llevamos al usuario directo a su portal,
        // en vez de dejarlo en la página principal de marketing.
        this.router.navigateByUrl('/appointments');
      }
    });

    // Cada vez que MSAL termina una interacción (o se cierra sesión en otra pestaña) se revalida la cuenta activa.
    this.msalBroadcast.inProgress$.pipe(
      filter((estado: InteractionStatus) => estado === InteractionStatus.None),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.asegurarCuentaActiva());

    this.modoOscuro = localStorage.getItem('vidasalud-modo-oscuro') === '1';
    document.body.classList.toggle('dark-mode', this.modoOscuro);
  }

  get logueada(): boolean {
    return this.msal.instance.getAllAccounts().length > 0;
  }

  get nombre(): string {
    const cuenta = this.msal.instance.getActiveAccount();
    return cuenta ? (cuenta.name ?? cuenta.username) : '';
  }

  get roles(): string[] {
    const cuenta = this.msal.instance.getActiveAccount();
    if (cuenta?.idTokenClaims && 'roles' in cuenta.idTokenClaims) {
      return (cuenta.idTokenClaims as any).roles || [];
    }
    return [];
  }

  get esAdmin(): boolean {
    return this.roles.some(r => r === 'Admin' || r === 'Recepcionista');
  }

  get etiquetaRol(): string {
    if (this.roles.includes('Admin')) return 'Admin';
    if (this.roles.includes('Recepcionista')) return 'Recepcionista';
    return 'Paciente';
  }

  private asegurarCuentaActiva(): void {
    const cuentas = this.msal.instance.getAllAccounts();
    if (!this.msal.instance.getActiveAccount() && cuentas.length > 0) {
      this.msal.instance.setActiveAccount(cuentas[0]);
    }
  }

  login(): void {
    this.msal.loginRedirect(loginRequest);
  }

  registrarse(): void {
    this.msal.loginRedirect(registroRequest);
  }

  pedirConfirmacionLogout(): void {
    this.mostrarConfirmacionLogout = true;
  }

  cancelarLogout(): void {
    this.mostrarConfirmacionLogout = false;
  }

  confirmarLogout(): void {
    this.mostrarConfirmacionLogout = false;
    this.msal.logoutRedirect({ account: this.msal.instance.getActiveAccount() });
  }

  toggleModoOscuro(): void {
    this.modoOscuro = !this.modoOscuro;
    document.body.classList.toggle('dark-mode', this.modoOscuro);
    localStorage.setItem('vidasalud-modo-oscuro', this.modoOscuro ? '1' : '0');
  }

  toggleMenu(nombre: string): void {
    this.menuAbierto = this.menuAbierto === nombre ? null : nombre;
  }

  cerrarMenu(): void {
    this.menuAbierto = null;
  }

  buscar(evento: Event): void {
    evento.preventDefault();
    const input = (evento.target as HTMLFormElement).elements.namedItem('busqueda') as HTMLInputElement;
    const termino = this.normalizar(input?.value ?? '');

    if (!termino) return;

    const coincidencia = this.especialidades.find(
      esp => this.normalizar(esp.nombre).includes(termino) || this.normalizar(esp.descripcion).includes(termino)
    );

    this.router.navigate(['/'], { fragment: coincidencia ? coincidencia.slug : 'especialidades' });
  }

  private normalizar(texto: string): string {
    return texto.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(evento: MouseEvent): void {
    if (this.menuAbierto && this.megaNavRef && !this.megaNavRef.nativeElement.contains(evento.target as Node)) {
      this.menuAbierto = null;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuAbierto = null;
  }
}
