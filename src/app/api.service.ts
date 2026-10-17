import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter, Observable, switchMap, take } from 'rxjs';
import { bffUrl } from './auth.config';

export interface UserProfile {
  /** Nombre para mostrar, para el saludo. */
  nombre: string;
  /** Nombre y apellido, para la ficha clínica. */
  nombreCompleto?: string;
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

export interface InstitutionalInfo {
  titulo: string;
  descripcion: string;
  telefono: string;
  email: string;
  horario: string;
  direccion: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = bffUrl;

  /**
   * Emite una vez cuando MSAL no tiene ninguna interacción en curso (login, redirect o renovación de token).
   * El token Bearer lo adjunta y renueva MsalInterceptor; aquí solo evitamos disparar llamadas mientras MSAL
   * todavía está procesando el redirect, que era lo que hacía que a veces la petición saliera sin token.
   */
  private msalListo$: Observable<unknown>;

  constructor(private http: HttpClient, msalBroadcast: MsalBroadcastService) {
    this.msalListo$ = msalBroadcast.inProgress$.pipe(
      filter(estado => estado === InteractionStatus.None),
      take(1)
    );
  }

  private cuandoMsalListo<T>(peticion: () => Observable<T>): Observable<T> {
    return this.msalListo$.pipe(switchMap(peticion));
  }

  getAppointments(): Observable<Appointment[]> {
    return this.cuandoMsalListo(() => this.http.get<Appointment[]>(`${this.base}/api/appointments`));
  }

  createAppointment(cita: { pacienteNombre: string; servicioId: number; boxId?: number; fechaHora?: string }): Observable<Appointment> {
    return this.cuandoMsalListo(() => this.http.post<Appointment>(`${this.base}/api/appointments`, cita));
  }

  updateAppointmentStatus(id: number, status: string): Observable<Appointment> {
    return this.cuandoMsalListo(() => this.http.put<Appointment>(`${this.base}/api/appointments/${id}/status`, { status }));
  }

  getCatalog(): Observable<ClinicalService[]> {
    return this.cuandoMsalListo(() => this.http.get<ClinicalService[]>(`${this.base}/api/catalog/services`));
  }

  createService(data: { nombre: string; precio: number; boxId?: number; cuposDisponibles: number }): Observable<ClinicalService> {
    return this.cuandoMsalListo(() => this.http.post<ClinicalService>(`${this.base}/api/catalog/services`, data));
  }

  updateService(id: number, data: Partial<ClinicalService>): Observable<ClinicalService> {
    return this.cuandoMsalListo(() => this.http.put<ClinicalService>(`${this.base}/api/catalog/services/${id}`, data));
  }

  getMe(): Observable<UserProfile> {
    return this.cuandoMsalListo(() => this.http.get<UserProfile>(`${this.base}/api/me`));
  }

  /** Información institucional del centro: lectura pública, sin requerir sesión activa. */
  getInfoInstitucional(): Observable<InstitutionalInfo> {
    return this.http.get<InstitutionalInfo>(`${this.base}/api/info`);
  }

  actualizarInfoInstitucional(data: Partial<InstitutionalInfo>): Observable<InstitutionalInfo> {
    return this.cuandoMsalListo(() => this.http.put<InstitutionalInfo>(`${this.base}/api/info`, data));
  }
}
