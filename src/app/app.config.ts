import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  PublicClientApplication, IPublicClientApplication,
  InteractionType, BrowserCacheLocation
} from '@azure/msal-browser';
import {
  MsalInterceptor, MsalService, MsalGuard, MsalBroadcastService,
  MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration, MsalInterceptorConfiguration, ProtectedResourceScopes
} from '@azure/msal-angular';
import { routes } from './app.routes';
import { clientId, tenantId, apiScope, bffUrl, loginRequest } from './auth.config';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: clientId,
      authority: 'https://login.microsoftonline.com/' + tenantId,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin
    },
    cache: { cacheLocation: BrowserCacheLocation.LocalStorage }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: loginRequest
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  // MSAL usa la primera ruta que calce, así que las excepciones públicas van antes del comodín /api/*.
  // GET /api/info y /api/health son públicos: no deben pedir token (si no, un visitante sin sesión es
  // redirigido al login). PUT /api/info sí requiere token de Admin.
  const protectedResourceMap = new Map<string, Array<string | ProtectedResourceScopes> | null>();
  for (const base of [bffUrl, 'http://localhost:8080']) {
    protectedResourceMap.set(`${base}/api/info`, [
      { httpMethod: 'GET', scopes: null },
      { httpMethod: 'PUT', scopes: [apiScope] }
    ]);
    protectedResourceMap.set(`${base}/api/health`, null);
    protectedResourceMap.set(`${base}/api/*`, [apiScope]);
  }
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    {
      provide: APP_INITIALIZER,
      useFactory: (msal: MsalService) => async () => {
        await msal.instance.initialize();
        // Sincroniza el login/logout entre pestañas abiertas de la app.
        msal.instance.enableAccountStorageEvents();
      },
      deps: [MsalService],
      multi: true
    }
  ]
};
