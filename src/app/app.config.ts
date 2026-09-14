import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  PublicClientApplication, IPublicClientApplication,
  InteractionType, BrowserCacheLocation
} from '@azure/msal-browser';
import {
  MsalInterceptor, MsalService, MsalGuard, MsalBroadcastService,
  MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration, MsalInterceptorConfiguration
} from '@azure/msal-angular';
import { routes } from './app.routes';

const clientId = '2c70c5bc-6b56-4564-bca4-ec0821f3cefa';
const tenantId = '49cd374a-62d5-4d3d-851e-69058d58e3b5';
const apiScope = 'api://2c70c5bc-6b56-4564-bca4-ec0821f3cefa/access_as_user';
const bffUrl = 'http://localhost:8080';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: clientId,
      authority: 'https://login.microsoftonline.com/' + tenantId,
      redirectUri: 'http://localhost:4200',
      postLogoutRedirectUri: 'http://localhost:4200'
    },
    cache: { cacheLocation: BrowserCacheLocation.LocalStorage }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: [apiScope] }
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('http://localhost:8080/api/appointments', [apiScope]);
  protectedResourceMap.set('http://localhost:8080/api/me', [apiScope]);
  protectedResourceMap.set('http://localhost:8080/api/catalog/services', [apiScope]);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
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
      useFactory: (msal: MsalService) => () => msal.instance.initialize(),
      deps: [MsalService],
      multi: true
    }
  ]
};
