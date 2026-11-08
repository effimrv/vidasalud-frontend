import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { ApiService, AuditEntrada } from '../api.service';
import { describirErrorHttp } from '../shared/mensajes-error';

/** Intervalo de actualización de los eventos recientes. */
const REFRESCO_MS = 10000;

/** Eventos del ciclo de una atención, con su nombre para el personal y la clase de color. */
const EVENTOS: Record<string, { etiqueta: string; clase: string }> = {
  CREADA: { etiqueta: 'Solicitud en revisión', clase: 'ev-solicitud' },
  CONFIRMADA: { etiqueta: 'Hora confirmada', clase: 'ev-confirmada' },
  EN_ESPERA: { etiqueta: 'En sala de espera', clase: 'ev-espera' },
  EN_ATENCION: { etiqueta: 'En consulta', clase: 'ev-atencion' },
  CERRADA: { etiqueta: 'Atención finalizada', clase: 'ev-cerrada' },
  CANCELADA: { etiqueta: 'Cancelada', clase: 'ev-cancelada' }
};

/**
 * Vista de auditoría (Admin y Auditor): solo lectura. Muestra los cambios de las atenciones, quién los hizo
 * y desde qué evento de Kafka llegó cada registro.
 */
@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css'
})
export class AuditComponent implements OnInit {
  readonly tipos = Object.keys(EVENTOS);

  eventos: AuditEntrada[] = [];
  cargando = true;
  error = '';
  ultimaActualizacion: Date | null = null;

  filtroTipo = 'TODOS';
  filtroCita = '';

  /** Cita cuyo timeline está abierto; null cuando se ven los eventos recientes. */
  citaAbierta: number | null = null;
  timeline: AuditEntrada[] = [];
  cargandoTimeline = false;
  errorTimeline = '';

  constructor(private api: ApiService, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    this.cargarEventos();
    interval(REFRESCO_MS).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cargarEventos());
  }

  cargarEventos(): void {
    this.api.getAuditEventos().subscribe({
      next: lista => {
        this.eventos = lista;
        this.cargando = false;
        this.error = '';
        this.ultimaActualizacion = new Date();
      },
      error: err => {
        this.cargando = false;
        this.error = describirErrorHttp(err, 'cargar la auditoría');
      }
    });
  }

  /** Cantidad de atenciones distintas en los eventos cargados. */
  get atencionesDistintas(): number {
    return new Set(this.eventos.map(e => e.citaId)).size;
  }

  get eventosFiltrados(): AuditEntrada[] {
    const cita = this.filtroCita.trim();
    return this.eventos.filter(e =>
      (this.filtroTipo === 'TODOS' || e.tipo === this.filtroTipo) &&
      (cita === '' || String(e.citaId).includes(cita)));
  }

  etiquetaEvento(tipo: string): string {
    return EVENTOS[tipo]?.etiqueta ?? tipo;
  }

  claseEvento(tipo: string): string {
    return EVENTOS[tipo]?.clase ?? 'ev-neutro';
  }

  abrirTimeline(citaId: number): void {
    this.citaAbierta = citaId;
    this.timeline = [];
    this.errorTimeline = '';
    this.cargandoTimeline = true;
    this.api.getAuditTimeline(citaId).subscribe({
      next: lista => {
        this.timeline = lista;
        this.cargandoTimeline = false;
      },
      error: err => {
        this.cargandoTimeline = false;
        this.errorTimeline = describirErrorHttp(err, 'cargar el timeline de la cita');
      }
    });
  }

  cerrarTimeline(): void {
    this.citaAbierta = null;
  }

  /** Fecha y hora en la zona local de quien consulta, con segundos (la auditoría es sobre instantes exactos). */
  formatearFecha(instante: string): string {
    return new Date(instante).toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
}
