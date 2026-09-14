import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-heading">
      <div>
        <span class="eyebrow">PANEL OPERATIVO</span>
        <h1>Atenciones</h1>
        <p>Seguimiento de solicitudes y estados de atención.</p>
      </div>
      <div class="user-badge" *ngIf="yo">
        <span class="avatar">{{ yo.nombre.charAt(0) }}</span>
        <span><strong>{{ yo.nombre }}</strong><small>{{ yo.roles.join(', ') }}</small></span>
      </div>
    </section>

    <section class="stats-row">
      <article class="stat-card"><span>Total solicitudes</span><strong>{{ atenciones.length }}</strong></article>
      <article class="stat-card stat-card-accent"><span>Estado del sistema</span><strong>Activo <i></i></strong></article>
      <article class="stat-card"><span>Perfil actual</span><strong>{{ yo?.roles?.[0] || 'Usuario' }}</strong></article>
    </section>

    <section class="table-panel">
      <div class="panel-header">
        <div><h2>Solicitudes recientes</h2><p>Últimas atenciones registradas</p></div>
        <span class="record-count">{{ atenciones.length }} registros</span>
      </div>
      <div class="table-wrap" *ngIf="atenciones.length > 0; else emptyState">
        <table>
          <thead><tr><th>ID</th><th>Paciente</th><th>Servicio</th><th>Estado</th></tr></thead>
          <tbody><tr *ngFor="let a of atenciones">
            <td class="id-cell">#{{ a.id }}</td><td><strong>{{ a.pacienteNombre }}</strong></td>
            <td>Servicio {{ a.servicioId }}</td><td><span class="status-pill">{{ a.estado }}</span></td>
          </tr></tbody>
        </table>
      </div>
      <ng-template #emptyState><div class="empty-state"><span class="empty-icon">&#10003;</span><h3>No hay atenciones todavía</h3><p>Las nuevas solicitudes aparecerán aquí.</p></div></ng-template>
    </section>
  `
})
export class AppointmentsComponent implements OnInit {
  atenciones: any[] = [];
  yo: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getMe().subscribe(r => this.yo = r);
    this.api.getAppointments().subscribe(r => this.atenciones = r);
  }
}
