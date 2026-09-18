import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
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

  constructor(private msal: MsalService, private router: Router) {}

  ngOnInit(): void {
    this.msal.instance.handleRedirectPromise().then(result => {
      if (result?.account) {
        this.msal.instance.setActiveAccount(result.account);
        // Venimos de un login recién completado: llevamos al usuario directo a su portal,
        // en vez de dejarlo en la página principal de marketing.
        this.router.navigateByUrl('/appointments');
      } else {
        const cuentas = this.msal.instance.getAllAccounts();
        if (cuentas.length > 0) this.msal.instance.setActiveAccount(cuentas[0]);
      }
    });

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

  login(): void {
    this.msal.loginRedirect();
  }

  logout(): void {
    this.msal.logoutRedirect();
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
