import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadoAtencion } from '../api.service';
import { PASOS_CITA, indicePaso } from './formato';

/** Barra de pasos de una cita: Solicitada → Confirmada → En espera → En consulta → Finalizada. */
@Component({
  selector: 'app-progreso-cita',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ol class="progreso-cita" *ngIf="estado !== 'CANCELADA'; else cancelada" [attr.aria-label]="'Progreso de la cita'">
      <li *ngFor="let paso of pasos; let i = index" [class.hecho]="hecho(i)" [class.actual]="i === actual && estado !== 'CERRADA'">
        <span class="progreso-punto">{{ hecho(i) ? '✓' : i + 1 }}</span>
        <span class="progreso-etiqueta">{{ paso.etiqueta }}</span>
      </li>
    </ol>
    <ng-template #cancelada>
      <p class="progreso-cancelada">✕ Cita cancelada</p>
    </ng-template>
  `
})
export class ProgresoCitaComponent {
  @Input({ required: true }) estado!: EstadoAtencion;

  readonly pasos = PASOS_CITA;

  get actual(): number {
    return indicePaso(this.estado);
  }

  hecho(i: number): boolean {
    return i < this.actual || this.estado === 'CERRADA';
  }
}
