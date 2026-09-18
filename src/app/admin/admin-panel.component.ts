import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Appointment, ClinicalService, UserProfile } from '../api.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="dashboard-hero dashboard-hero-admin">
      <div class="page-heading">
        <div>
          <span class="eyebrow">PANEL DE ADMINISTRACIÓN · VIDA SALUD</span>
          <h1>Gestión Clínica</h1>
          <p>Administra el catálogo de especialidades, revisa el rendimiento del centro y supervisa las atenciones.</p>
        </div>
        <div class="user-badge badge-admin" *ngIf="yo">
          <span class="avatar avatar-admin">🛡️</span>
          <span>
            <strong>{{ yo.nombre }}</strong>
            <small>{{ yo.roles.join(', ') || 'Administrador' }}</small>
          </span>
        </div>
      </div>
    </section>

    <div *ngIf="exitoMensaje" class="alert-banner alert-success">
      <span>{{ exitoMensaje }}</span>
      <button type="button" class="alert-close" (click)="exitoMensaje = ''">&times;</button>
    </div>
    <div *ngIf="errorMensaje" class="alert-banner alert-error">
      <span>{{ errorMensaje }}</span>
      <button type="button" class="alert-close" (click)="errorMensaje = ''">&times;</button>
    </div>

    <div class="admin-tabs">
      <button
        type="button"
        class="admin-tab-btn"
        [class.admin-tab-active]="tabActiva === 'catalogo'"
        (click)="tabActiva = 'catalogo'"
      >
        <span class="admin-tab-icon" aria-hidden="true">🗂️</span> Gestión de Especialidades y Precios
      </button>
      <button
        type="button"
        class="admin-tab-btn"
        [class.admin-tab-active]="tabActiva === 'metricas'"
        (click)="tabActiva = 'metricas'"
      >
        <span class="admin-tab-icon" aria-hidden="true">📊</span> Métricas y Rendimiento Clínico
      </button>
      <button
        type="button"
        class="admin-tab-btn"
        [class.admin-tab-active]="tabActiva === 'supervision'"
        (click)="tabActiva = 'supervision'"
      >
        <span class="admin-tab-icon" aria-hidden="true">🔎</span> Supervisión de Atenciones
      </button>
    </div>

    <!-- ================= TAB 1: Gestión de Especialidades y Precios ================= -->
    <section class="table-panel" *ngIf="tabActiva === 'catalogo'">
      <div class="panel-header admin-panel-header">
        <div>
          <h2>Prestaciones Médicas del Centro</h2>
          <p>Administra precios, box asignado y cupos disponibles de cada especialidad.</p>
        </div>
        <button type="button" class="button button-primary btn-header-action" (click)="abrirModalCrear()">
          + Nueva Especialidad
        </button>
      </div>

      <div class="table-wrap" *ngIf="catalogo.length > 0; else sinCatalogo">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre de la Especialidad</th>
              <th>Precio Actual</th>
              <th>Box Asignado</th>
              <th>Cupos Disponibles</th>
              <th class="th-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of catalogo">
              <td class="id-cell">#{{ s.id }}</td>
              <td><strong>{{ s.nombre }}</strong></td>
              <td>{{ formatearPrecio(s.precio) }}</td>
              <td>Box {{ s.boxId || '—' }}</td>
              <td>{{ s.cuposDisponibles }}</td>
              <td class="td-actions">
                <button type="button" class="btn-op btn-op-step" (click)="abrirModalEditar(s)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #sinCatalogo>
        <div class="empty-state">
          <span class="empty-icon">🗂️</span>
          <h3>Aún no hay especialidades registradas</h3>
          <p>Usa "+ Nueva Especialidad" para comenzar a construir el catálogo clínico.</p>
        </div>
      </ng-template>
    </section>

    <!-- ================= TAB 2: Métricas y Rendimiento Clínico ================= -->
    <ng-container *ngIf="tabActiva === 'metricas'">
      <section class="stats-row">
        <article class="stat-card stat-card-accent">
          <span>Recaudación estimada</span>
          <strong>{{ formatearPrecio(recaudacionEstimada) }}</strong>
        </article>
        <article class="stat-card">
          <span>Especialidades activas</span>
          <strong>{{ totalEspecialidadesActivas }}</strong>
        </article>
        <article class="stat-card">
          <span>Especialidad más demandada</span>
          <strong class="stat-text">{{ especialidadMasDemandada }}</strong>
        </article>
      </section>

      <section class="stats-row stats-row-half">
        <article class="stat-card stat-card-warning">
          <span>Atenciones realizadas</span>
          <strong>{{ atencionesRealizadas }}</strong>
        </article>
        <article class="stat-card">
          <span>Atenciones canceladas</span>
          <strong>{{ atencionesCanceladas }}</strong>
        </article>
      </section>
    </ng-container>

    <!-- ================= TAB 3: Supervisión de Atenciones ================= -->
    <section class="table-panel" *ngIf="tabActiva === 'supervision'">
      <div class="panel-header admin-panel-header">
        <div>
          <h2>Supervisión de Atenciones</h2>
          <p>Vista de auditoría de todas las citas registradas en la clínica.</p>
        </div>
        <div class="admin-filters">
          <input
            type="text"
            class="search-input"
            [(ngModel)]="terminoBusquedaSupervision"
            placeholder="Buscar por paciente o ID..."
          />
        </div>
      </div>

      <div class="status-tabs">
        <button type="button" class="tab-btn" [class.tab-active]="filtroEstadoSupervision === 'TODAS'" (click)="filtroEstadoSupervision = 'TODAS'">
          Todas ({{ atenciones.length }})
        </button>
        <button type="button" class="tab-btn" [class.tab-active]="filtroEstadoSupervision === 'SOLICITADA'" (click)="filtroEstadoSupervision = 'SOLICITADA'">
          Solicitadas ({{ countPorEstado('SOLICITADA') }})
        </button>
        <button type="button" class="tab-btn" [class.tab-active]="filtroEstadoSupervision === 'CONFIRMADA'" (click)="filtroEstadoSupervision = 'CONFIRMADA'">
          Confirmadas ({{ countPorEstado('CONFIRMADA') }})
        </button>
        <button type="button" class="tab-btn" [class.tab-active]="filtroEstadoSupervision === 'EN_ESPERA'" (click)="filtroEstadoSupervision = 'EN_ESPERA'">
          En Espera ({{ countPorEstado('EN_ESPERA') }})
        </button>
        <button type="button" class="tab-btn" [class.tab-active]="filtroEstadoSupervision === 'EN_ATENCION'" (click)="filtroEstadoSupervision = 'EN_ATENCION'">
          En Consulta ({{ countPorEstado('EN_ATENCION') }})
        </button>
        <button type="button" class="tab-btn" [class.tab-active]="filtroEstadoSupervision === 'CERRADA'" (click)="filtroEstadoSupervision = 'CERRADA'">
          Cerradas ({{ countPorEstado('CERRADA') }})
        </button>
        <button type="button" class="tab-btn" [class.tab-active]="filtroEstadoSupervision === 'CANCELADA'" (click)="filtroEstadoSupervision = 'CANCELADA'">
          Canceladas ({{ countPorEstado('CANCELADA') }})
        </button>
      </div>

      <div class="table-wrap" *ngIf="atencionesFiltradasSupervision.length > 0; else sinSupervision">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Paciente</th>
              <th>Servicio / Prestación</th>
              <th>Cita Agendada Para</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of atencionesFiltradasSupervision">
              <td class="id-cell">#{{ a.id }}</td>
              <td><strong>{{ a.pacienteNombre }}</strong></td>
              <td>
                {{ getServicioNombre(a.servicioId) }}
                <small class="text-subtle d-block" *ngIf="a.boxId">Box {{ a.boxId }}</small>
              </td>
              <td>{{ formatearFechaHoraCita(a.fechaHora) }}</td>
              <td>
                <span class="status-badge" [ngClass]="'badge-' + a.estado.toLowerCase()">{{ a.estado }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #sinSupervision>
        <div class="empty-state">
          <span class="empty-icon">&#10003;</span>
          <h3>No se encontraron atenciones</h3>
          <p>No hay solicitudes que coincidan con el filtro actual o la búsqueda ingresada.</p>
        </div>
      </ng-template>
    </section>

    <!-- ================= Modal: Nueva Especialidad / Editar Especialidad ================= -->
    <div class="modal-overlay" *ngIf="modalAbierto" (click)="cerrarModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ modoFormulario === 'crear' ? '+ Nueva Especialidad' : 'Editar Especialidad' }}</h3>
          <button type="button" class="alert-close" (click)="cerrarModal()">&times;</button>
        </div>

        <form (ngSubmit)="guardarServicio()" class="booking-form">
          <div class="form-grid">
            <div class="form-group form-group-full">
              <label for="formNombre">Nombre de la prestación</label>
              <input
                id="formNombre"
                type="text"
                class="form-control"
                [(ngModel)]="formNombre"
                name="formNombre"
                placeholder="Ej: Pediatría, Kinesiología"
                required
              />
            </div>

            <div class="form-group">
              <label for="formPrecio">Precio de la consulta (CLP)</label>
              <input
                id="formPrecio"
                type="number"
                class="form-control"
                [(ngModel)]="formPrecio"
                name="formPrecio"
                min="0"
                required
              />
            </div>

            <div class="form-group">
              <label for="formBoxId">Box asignado</label>
              <input
                id="formBoxId"
                type="number"
                class="form-control"
                [(ngModel)]="formBoxId"
                name="formBoxId"
                min="1"
                placeholder="Ej: 1"
              />
            </div>

            <div class="form-group form-group-full">
              <label for="formCupos">Cupos disponibles</label>
              <input
                id="formCupos"
                type="number"
                class="form-control"
                [(ngModel)]="formCupos"
                name="formCupos"
                min="0"
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="button-quiet" (click)="cerrarModal()">Cancelar</button>
            <button type="submit" class="button button-primary btn-header-action" [disabled]="guardandoServicio">
              <span *ngIf="guardandoServicio" class="spinner"></span>
              {{ guardandoServicio ? 'Guardando...' : (modoFormulario === 'crear' ? 'Registrar Especialidad' : 'Guardar Cambios') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AdminPanelComponent implements OnInit {
  @Input() atenciones: Appointment[] = [];
  @Input() yo: UserProfile | null = null;

  tabActiva: 'catalogo' | 'metricas' | 'supervision' = 'catalogo';

  catalogo: ClinicalService[] = [];

  // Modal de especialidad
  modalAbierto = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  servicioEditandoId: number | null = null;
  formNombre = '';
  formPrecio: number | null = null;
  formBoxId: number | null = null;
  formCupos: number | null = null;
  guardandoServicio = false;

  // Filtros de la pestaña de supervisión
  filtroEstadoSupervision: string = 'TODAS';
  terminoBusquedaSupervision: string = '';

  exitoMensaje = '';
  errorMensaje = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.api.getCatalog().subscribe({
      next: list => { this.catalogo = list || []; },
      error: () => { this.errorMensaje = 'No se pudo cargar el catálogo de prestaciones.'; }
    });
  }

  abrirModalCrear(): void {
    this.modoFormulario = 'crear';
    this.servicioEditandoId = null;
    this.formNombre = '';
    this.formPrecio = null;
    this.formBoxId = null;
    this.formCupos = null;
    this.modalAbierto = true;
  }

  abrirModalEditar(servicio: ClinicalService): void {
    this.modoFormulario = 'editar';
    this.servicioEditandoId = servicio.id;
    this.formNombre = servicio.nombre;
    this.formPrecio = servicio.precio;
    this.formBoxId = servicio.boxId ?? null;
    this.formCupos = servicio.cuposDisponibles;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarServicio(): void {
    const nombre = this.formNombre.trim();
    const precio = this.formPrecio;
    const cupos = this.formCupos;

    if (!nombre || precio === null || cupos === null) {
      this.errorMensaje = 'Completa nombre, precio y cupos para guardar la especialidad.';
      return;
    }

    this.guardandoServicio = true;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    const datos = {
      nombre,
      precio,
      boxId: this.formBoxId ?? undefined,
      cuposDisponibles: cupos
    };

    const peticion = this.modoFormulario === 'crear'
      ? this.api.createService(datos)
      : this.api.updateService(this.servicioEditandoId!, datos);

    peticion.subscribe({
      next: () => {
        this.guardandoServicio = false;
        this.exitoMensaje = this.modoFormulario === 'crear'
          ? `Especialidad "${nombre}" registrada con éxito.`
          : `Especialidad "${nombre}" actualizada con éxito.`;
        this.modalAbierto = false;
        this.cargarCatalogo();
      },
      error: () => {
        this.guardandoServicio = false;
        this.errorMensaje = 'Ocurrió un error al guardar la especialidad. Inténtalo nuevamente.';
      }
    });
  }

  // ===== Métricas y Rendimiento Clínico =====

  get recaudacionEstimada(): number {
    return this.atenciones
      .filter(a => a.estado === 'CONFIRMADA' || a.estado === 'CERRADA')
      .reduce((suma, a) => suma + (this.getServicioPrecio(a.servicioId) || 0), 0);
  }

  get totalEspecialidadesActivas(): number {
    return this.catalogo.length;
  }

  get especialidadMasDemandada(): string {
    if (this.atenciones.length === 0) return 'Sin datos aún';

    const conteoPorServicio = new Map<number, number>();
    for (const a of this.atenciones) {
      conteoPorServicio.set(a.servicioId, (conteoPorServicio.get(a.servicioId) || 0) + 1);
    }

    let servicioTopId: number | null = null;
    let maxConteo = 0;
    for (const [servicioId, conteo] of conteoPorServicio) {
      if (conteo > maxConteo) {
        maxConteo = conteo;
        servicioTopId = servicioId;
      }
    }

    return servicioTopId !== null ? this.getServicioNombre(servicioTopId) : 'Sin datos aún';
  }

  get atencionesRealizadas(): number {
    return this.atenciones.filter(a => a.estado !== 'CANCELADA').length;
  }

  get atencionesCanceladas(): number {
    return this.atenciones.filter(a => a.estado === 'CANCELADA').length;
  }

  // ===== Supervisión de Atenciones =====

  get atencionesFiltradasSupervision(): Appointment[] {
    let lista = this.atenciones;
    if (this.filtroEstadoSupervision !== 'TODAS') {
      lista = lista.filter(a => a.estado === this.filtroEstadoSupervision);
    }
    if (this.terminoBusquedaSupervision.trim()) {
      const q = this.terminoBusquedaSupervision.toLowerCase().trim();
      lista = lista.filter(a =>
        a.id.toString().includes(q) ||
        a.pacienteNombre.toLowerCase().includes(q)
      );
    }
    return lista;
  }

  countPorEstado(estado: string): number {
    return this.atenciones.filter(a => a.estado === estado).length;
  }

  getServicioNombre(servicioId: number): string {
    const serv = this.catalogo.find(s => s.id === servicioId);
    return serv ? serv.nombre : `Servicio #${servicioId}`;
  }

  getServicioPrecio(servicioId: number): number | undefined {
    const serv = this.catalogo.find(s => s.id === servicioId);
    return serv?.precio;
  }

  formatearPrecio(valor?: number): string {
    if (valor === undefined || valor === null) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatearFechaHoraCita(fechaHora?: string): string {
    if (!fechaHora) return 'Por confirmar';
    try {
      const d = new Date(fechaHora);
      const dia = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
      const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${dia}, ${hora} hrs`;
    } catch {
      return fechaHora;
    }
  }
}
