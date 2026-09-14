import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(private msal: MsalService) {}

  ngOnInit(): void {
    this.msal.instance.handleRedirectPromise().then(result => {
      if (result?.account) {
        this.msal.instance.setActiveAccount(result.account);
      } else {
        const cuentas = this.msal.instance.getAllAccounts();
        if (cuentas.length > 0) this.msal.instance.setActiveAccount(cuentas[0]);
      }
    });
  }

  get logueada(): boolean {
    return this.msal.instance.getAllAccounts().length > 0;
  }

  get nombre(): string {
    const cuenta = this.msal.instance.getActiveAccount();
    return cuenta ? (cuenta.name ?? cuenta.username) : '';
  }

  login(): void {
    this.msal.loginRedirect();
  }

  logout(): void {
    this.msal.logoutRedirect();
  }
}
