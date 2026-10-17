import { Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap } from 'rxjs';
import { ApiService, ClinicalService, DetalleAtencion } from '../api.service';
import { ProgresoCitaComponent } from './progreso-cita.component';
import { describirErrorHttp } from './mensajes-error';
import {
  ESTADOS_CANCELABLES, estadoLegible, formatearFechaHoraCita, formatearFechaHoraSolicitud, formatearPrecio, haceCuanto
} from './formato';

/** Intervalo de actualización del detalle mientras está abierto. */
const REFRESCO_MS = 5000;

/** Ventana con todos los datos de una cita y su historial; se actualiza sola mientras está abierta. */
@Component({
  selector: 'app-detalle-cita',
  standalone: true,
  imports: [CommonModule, ProgresoCitaComponent],
  templateUrl: './detalle-cita.component.html'
})
export class DetalleCitaComponent implements OnInit {
  @Input({ required: true }) atencionId!: number;
  @Input() catalogo: ClinicalService[] = [];
  /** Vista del personal del centro: muestra correo y si la reserva es de un paciente simulado. */
  @Input() vistaPersonal = false;
  @Output() cerrar = new EventEmitter<void>();
  /** Se emite al cancelar la cita, para que la vista que abrió el detalle recargue su lista. */
  @Output() actualizada = new EventEmitter<void>();

  detalle: DetalleAtencion | null = null;
  error = '';
  cancelando = false;

  readonly estadoLegible = estadoLegible;
  readonly formatearFechaHoraCita = formatearFechaHoraCita;
  readonly formatearFechaHoraSolicitud = formatearFechaHoraSolicitud;
  readonly haceCuanto = haceCuanto;

  constructor(private api: ApiService, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    interval(REFRESCO_MS).pipe(
      startWith(0),
      switchMap(() => this.api.getDetalleAtencion(this.atencionId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: detalle => { this.detalle = detalle; this.error = ''; },
      error: err => { this.error = describirErrorHttp(err, 'cargar el detalle de la cita'); }
    });
  }

  get nombreServicio(): string {
    const servicio = this.servicio;
    return servicio ? servicio.nombre : `Prestación #${this.detalle?.servicioId}`;
  }

  get precio(): string {
    return formatearPrecio(this.servicio?.precio);
  }

  get cancelable(): boolean {
    return !!this.detalle && ESTADOS_CANCELABLES.includes(this.detalle.estado);
  }

  cancelar(): void {
    if (!this.detalle) return;
    this.cancelando = true;
    this.api.updateAppointmentStatus(this.detalle.id, 'CANCELADA').pipe(
      switchMap(() => this.api.getDetalleAtencion(this.atencionId))
    ).subscribe({
      next: detalle => {
        this.detalle = detalle;
        this.cancelando = false;
        this.actualizada.emit();
      },
      error: err => {
        this.cancelando = false;
        this.error = describirErrorHttp(err, 'cancelar la cita');
      }
    });
  }

  private get servicio(): ClinicalService | undefined {
    return this.catalogo.find(s => s.id === this.detalle?.servicioId);
  }
}
