import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { from, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'https://dzv5td4m80.execute-api.us-east-1.amazonaws.com';
  private scope = 'api://2c70c5bc-6b56-4564-bca4-ec0821f3cefa/access_as_user';

  constructor(private http: HttpClient, private msal: MsalService) {}

  private conToken<T>(url: string): Observable<T> {
    const cuenta = this.msal.instance.getActiveAccount()
      ?? this.msal.instance.getAllAccounts()[0];
    return from(
      this.msal.instance.acquireTokenSilent({ scopes: [this.scope], account: cuenta })
    ).pipe(
      switchMap(result => {
        const headers = new HttpHeaders({ Authorization: 'Bearer ' + result.accessToken });
        return this.http.get<T>(url, { headers });
      })
    );
  }

  getAppointments(): Observable<any> {
    return this.conToken(this.base + '/api/appointments');
  }

  getCatalog(): Observable<any> {
    return this.conToken(this.base + '/api/catalog/services');
  }

  getMe(): Observable<any> {
    return this.conToken(this.base + '/api/me');
  }
}
