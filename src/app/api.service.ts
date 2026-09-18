import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { from, Observable, of, switchMap, catchError, throwError } from 'rxjs';

export interface UserProfile {
  nombre: string;
  usuario: string;
  roles: string[];
}

export interface Appointment {
  id: number;
  pacienteNombre: string;
  servicioId: number;
  boxId?: number;
  estado: 'SOLICITADA' | 'CONFIRMADA' | 'EN_ESPERA' | 'EN_ATENCION' | 'CERRADA' | 'CANCELADA';
  creadaEn?: string;
  /** Fecha y hora para la que se agendó la atención (distinto de creadaEn, que es cuándo se solicitó). */
  fechaHora?: string;
}

export interface ClinicalService {
  id: number;
  nombre: string;
  precio: number;
  boxId?: number;
  cuposDisponibles: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'https://dzv5td4m80.execute-api.us-east-1.amazonaws.com';
  private scope = 'api://2c70c5bc-6b56-4564-bca4-ec0821f3cefa/access_as_user';

  constructor(private http: HttpClient, private msal: MsalService) {}

  private getHeaders(): Observable<HttpHeaders> {
    const cuenta = this.msal.instance.getActiveAccount()
      ?? this.msal.instance.getAllAccounts()[0];

    if (!cuenta) {
      return throwError(() => new Error('No hay sesión de usuario activa'));
    }

    return from(
      this.msal.instance.acquireTokenSilent({ scopes: [this.scope], account: cuenta })
    ).pipe(
      catchError(err => {
        if (err instanceof InteractionRequiredAuthError) {
          this.msal.loginRedirect();
        }
        return throwError(() => err);
      }),
      switchMap(result => of(new HttpHeaders({
        Authorization: 'Bearer ' + result.accessToken,
        'Content-Type': 'application/json'
      })))
    );
  }

  getAppointments(): Observable<Appointment[]> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<Appointment[]>(`${this.base}/api/appointments`, { headers }))
    );
  }

  createAppointment(cita: { pacienteNombre: string; servicioId: number; boxId?: number; fechaHora?: string }): Observable<Appointment> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.post<Appointment>(`${this.base}/api/appointments`, cita, { headers }))
    );
  }

  updateAppointmentStatus(id: number, status: string): Observable<Appointment> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.put<Appointment>(`${this.base}/api/appointments/${id}/status`, { status }, { headers }))
    );
  }

  getCatalog(): Observable<ClinicalService[]> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<ClinicalService[]>(`${this.base}/api/catalog/services`, { headers }))
    );
  }

  getMe(): Observable<UserProfile> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<UserProfile>(`${this.base}/api/me`, { headers }))
    );
  }
}
