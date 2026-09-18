import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Appointment, ClinicalService, UserProfile } from '../api.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Barra superior de contexto y alternancia de vista para pruebas -->
    <div class="view-switcher-bar">
      <div class="view-tag">
        <span class="role-pill" [ngClass]="modoActivo === 'admin' ? 'pill-admin' : 'pill-paciente'">
          {{ modoActivo === 'admin' ? '🛡️ Vista Gestión / Administrador' : '👤 Vista Portal del Paciente' }}
        </span>
        <small class="role-caption">Detectado según perfil: {{ yo?.roles?.[0] || 'Paciente' }}</small>
      </div>
      <div class="switcher-buttons">
        <span class="switcher-label">Simular vista:</span>
        <button type="button" class="btn-toggle" [class.btn-toggle-active]="vistaModo === 'auto'" (click)="vistaModo = 'auto'">
          Automática
        </button>
        <button type="button" class="btn-toggle" [class.btn-toggle-active]="vistaModo === 'paciente'" (click)="vistaModo = 'paciente'">
          Paciente
        </button>
        <button type="button" class="btn-toggle" [class.btn-toggle-active]="vistaModo === 'admin'" (click)="vistaModo = 'admin'">
          Administrador
        </button>
      </div>
    </div>

    <!-- Mensajes de Alerta -->
    <div *ngIf="exitoMensaje" class="alert-banner alert-success">
      <span>{{ exitoMensaje }}</span>
      <button type="button" class="alert-close" (click)="exitoMensaje = ''">&times;</button>
    </div>
    <div *ngIf="errorMensaje" class="alert-banner alert-error">
      <span>{{ errorMensaje }}</span>
      <button type="button" class="alert-close" (click)="errorMensaje = ''">&times;</button>
    </div>

    <!-- ========================================================================= -->
    <!-- 1. VISTA DE USUARIO / PACIENTE                                           -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="modoActivo === 'paciente'">
      <!-- Cabecera amigable del paciente -->
      <section class="page-heading">
        <div>
          <span class="eyebrow">PORTAL DEL PACIENTE · VIDA SALUD</span>
          <h1>Mis Citas y Atenciones</h1>
          <p>Revisa el estado de tus solicitudes médicas o agenda una nueva cita en línea.</p>
        </div>
        <div class="user-badge" *ngIf="yo">
          <span class="avatar">{{ yo.nombre ? yo.nombre.charAt(0).toUpperCase() : 'U' }}</span>
          <span>
            <strong>{{ yo.nombre }}</strong>
            <small>Paciente registrado</small>
          </span>
        </div>
      </section>

      <!-- Resumen del Paciente -->
      <section class="stats-row">
        <article class="stat-card">
          <span>Mis solicitudes registradas</span>
          <strong>{{ misAtenciones.length }}</strong>
        </article>
        <article class="stat-card stat-card-accent">
          <span>Próxima atención</span>
          <strong>{{ proximaAtencion ? getEstadoLegible(proximaAtencion.estado) : 'Sin citas activas' }} <i></i></strong>
        </article>
        <article class="stat-card">
          <span>Especialidades disponibles</span>
          <strong>{{ catalogo.length }} prestaciones</strong>
        </article>
      </section>

      <!-- Panel de Agendamiento de Nueva Cita -->
      <section class="patient-card booking-panel" id="seccion-agendar">
        <div class="panel-header-simple">
          <div>
            <span class="eyebrow">NUEVA ATENCIÓN</span>
            <h2>Solicitar una Cita Médica</h2>
            <p>Selecciona la prestación médica que requieres y confirma tu hora.</p>
          </div>
        </div>

        <form (ngSubmit)="agendarCita()" class="booking-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="pacienteNombre">Nombre del Paciente</label>
              <input
                id="pacienteNombre"
                type="text"
                class="form-control"
                [(ngModel)]="nuevoPacienteNombre"
                name="pacienteNombre"
                placeholder="Ingresa tu nombre completo"
                required
              />
            </div>

            <div class="form-group">
              <label for="servicioSelect">Especialidad / Prestación Médica</label>
              <select
                id="servicioSelect"
                class="form-control"
                [(ngModel)]="nuevoServicioId"
                name="servicioId"
                required
              >
                <option [ngValue]="null" disabled>-- Selecciona un servicio médico --</option>
                <option *ngFor="let s of catalogo" [ngValue]="s.id">
                  {{ s.nombre }} — {{ formatearPrecio(s.precio) }} ({{ s.cuposDisponibles }} cupos disp.)
                </option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="button button-primary"
              [disabled]="guardandoCita || !nuevoServicioId || !nuevoPacienteNombre"
            >
              <span *ngIf="guardandoCita" class="spinner"></span>
              {{ guardandoCita ? 'Registrando cita...' : '+ Confirmar Solicitud de Cita' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Sección "Mis Atenciones" -->
      <section class="table-panel">
        <div class="panel-header">
          <div>
            <h2>Historial de mis atenciones</h2>
            <p>Seguimiento detallado de tus horas solicitadas y atenciones médicas</p>
          </div>
          <span class="record-count">{{ misAtenciones.length }} citas</span>
        </div>

        <div class="table-wrap" *ngIf="misAtenciones.length > 0; else sinAtencionesPaciente">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Especialidad / Servicio</th>
                <th>Estado de la Cita</th>
                <th>Fecha de Solicitud</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of misAtenciones">
                <td class="id-cell">#{{ a.id }}</td>
                <td>
                  <strong>{{ getServicioNombre(a.servicioId) }}</strong>
                  <div class="text-subtle" *ngIf="getServicioPrecio(a.servicioId)">
                    Valor: {{ formatearPrecio(getServicioPrecio(a.servicioId)!) }}
                  </div>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="'badge-' + a.estado.toLowerCase()">
                    {{ getEstadoLegible(a.estado) }}
                  </span>
                </td>
                <td>{{ formatearFecha(a.creadaEn) }}</td>
                <td>
                  <button
                    *ngIf="a.estado === 'SOLICITADA'"
                    type="button"
                    class="btn-action-cancel"
                    (click)="cambiarEstado(a.id, 'CANCELADA')"
                    [disabled]="procesandoId === a.id"
                  >
                    Cancelar cita
                  </button>
                  <span *ngIf="a.estado !== 'SOLICITADA'" class="text-subtle">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #sinAtencionesPaciente>
          <div class="empty-state">
            <span class="empty-icon">🩺</span>
            <h3>Aún no tienes citas registradas</h3>
            <p>Utiliza el formulario superior para agendar tu primera atención de salud con nuestros especialistas.</p>
          </div>
        </ng-template>
      </section>

      <!-- Catálogo de Servicios para el Paciente -->
      <section class="catalog-section" *ngIf="catalogo.length > 0">
        <div class="section-heading">
          <h2>Prestaciones y Servicios de VidaSalud</h2>
          <p>Conoce nuestras especialidades médicas disponibles con atención presencial.</p>
        </div>
        <div class="catalog-grid">
          <article class="service-card" *ngFor="let serv of catalogo">
            <div class="service-card-head">
              <span class="service-icon">⚕️</span>
              <span class="service-price">{{ formatearPrecio(serv.precio) }}</span>
            </div>
            <h3>{{ serv.nombre }}</h3>
            <p class="service-info">
              Box asignado: <strong>Box {{ serv.boxId || '1' }}</strong><br />
              Cupos disponibles: <strong>{{ serv.cuposDisponibles }}</strong>
            </p>
            <button
              type="button"
              class="button button-quiet btn-full"
              (click)="seleccionarServicioParaAgendar(serv.id)"
            >
              Solicitar esta especialidad &rarr;
            </button>
          </article>
        </div>
      </section>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- 2. VISTA DE ADMINISTRADOR / RECEPCIONISTA (PANEL OPERATIVO)               -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="modoActivo === 'admin'">
      <section class="page-heading">
        <div>
          <span class="eyebrow">PANEL OPERATIVO · GESTIÓN CLÍNICA</span>
          <h1>Control de Atenciones</h1>
          <p>Supervisa las solicitudes de todos los pacientes, gestiona estados y asignación médica.</p>
        </div>
        <div class="user-badge badge-admin" *ngIf="yo">
          <span class="avatar avatar-admin">🛡️</span>
          <span>
            <strong>{{ yo.nombre }}</strong>
            <small>{{ yo.roles.join(', ') || 'Administrador' }}</small>
          </span>
        </div>
      </section>

      <!-- KPIs Operativos -->
      <section class="stats-row stats-admin">
        <article class="stat-card">
          <span>Total de solicitudes</span>
          <strong>{{ atenciones.length }}</strong>
        </article>
        <article class="stat-card stat-card-warning">
          <span>Pendientes por confirmar</span>
          <strong>{{ countPorEstado('SOLICITADA') }}</strong>
        </article>
        <article class="stat-card stat-card-accent">
          <span>En atención o espera</span>
          <strong>{{ countPorEstado('EN_ESPERA') + countPorEstado('EN_ATENCION') }} <i></i></strong>
        </article>
        <article class="stat-card">
          <span>Atenciones cerradas</span>
          <strong>{{ countPorEstado('CERRADA') }}</strong>
        </article>
      </section>

      <!-- Filtros y Búsqueda Operativa -->
      <section class="table-panel">
        <div class="panel-header admin-panel-header">
          <div>
            <h2>Todas las Solicitudes Clínicas</h2>
            <p>Lista general de pacientes y actualización de estados en tiempo real</p>
          </div>
          <div class="admin-filters">
            <input
              type="text"
              class="search-input"
              [(ngModel)]="terminoBusqueda"
              placeholder="Buscar por paciente o ID..."
            />
          </div>
        </div>

        <!-- Pestañas de Filtro de Estado -->
        <div class="status-tabs">
          <button
            type="button"
            class="tab-btn"
            [class.tab-active]="filtroEstado === 'TODAS'"
            (click)="filtroEstado = 'TODAS'"
          >
            Todas ({{ atenciones.length }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.tab-active]="filtroEstado === 'SOLICITADA'"
            (click)="filtroEstado = 'SOLICITADA'"
          >
            Solicitadas ({{ countPorEstado('SOLICITADA') }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.tab-active]="filtroEstado === 'CONFIRMADA'"
            (click)="filtroEstado = 'CONFIRMADA'"
          >
            Confirmadas ({{ countPorEstado('CONFIRMADA') }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.tab-active]="filtroEstado === 'EN_ESPERA'"
            (click)="filtroEstado = 'EN_ESPERA'"
          >
            En Espera ({{ countPorEstado('EN_ESPERA') }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.tab-active]="filtroEstado === 'EN_ATENCION'"
            (click)="filtroEstado = 'EN_ATENCION'"
          >
            En Consulta ({{ countPorEstado('EN_ATENCION') }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.tab-active]="filtroEstado === 'CERRADA'"
            (click)="filtroEstado = 'CERRADA'"
          >
            Cerradas ({{ countPorEstado('CERRADA') }})
          </button>
        </div>

        <div class="table-wrap" *ngIf="atencionesFiltradasAdmin.length > 0; else sinAtencionesAdmin">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Servicio / Prestación</th>
                <th>Fecha Solicitud</th>
                <th>Estado</th>
                <th class="th-actions">Acciones Operativas</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of atencionesFiltradasAdmin">
                <td class="id-cell">#{{ a.id }}</td>
                <td>
                  <strong>{{ a.pacienteNombre }}</strong>
                </td>
                <td>
                  {{ getServicioNombre(a.servicioId) }}
                  <small class="text-subtle d-block" *ngIf="a.boxId">Box {{ a.boxId }}</small>
                </td>
                <td>{{ formatearFecha(a.creadaEn) }}</td>
                <td>
                  <span class="status-badge" [ngClass]="'badge-' + a.estado.toLowerCase()">
                    {{ a.estado }}
                  </span>
                </td>
                <td class="td-actions">
                  <!-- Transición SOLICITADA -> CONFIRMADA o CANCELADA -->
                  <ng-container *ngIf="a.estado === 'SOLICITADA'">
                    <button
                      type="button"
                      class="btn-op btn-op-confirm"
                      (click)="cambiarEstado(a.id, 'CONFIRMADA')"
                      [disabled]="procesandoId === a.id"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      class="btn-op btn-op-cancel"
                      (click)="cambiarEstado(a.id, 'CANCELADA')"
                      [disabled]="procesandoId === a.id"
                    >
                      Cancelar
                    </button>
                  </ng-container>

                  <!-- Transición CONFIRMADA -> EN_ESPERA o CANCELADA -->
                  <ng-container *ngIf="a.estado === 'CONFIRMADA'">
                    <button
                      type="button"
                      class="btn-op btn-op-step"
                      (click)="cambiarEstado(a.id, 'EN_ESPERA')"
                      [disabled]="procesandoId === a.id"
                    >
                      A Sala de Espera
                    </button>
                    <button
                      type="button"
                      class="btn-op btn-op-cancel"
                      (click)="cambiarEstado(a.id, 'CANCELADA')"
                      [disabled]="procesandoId === a.id"
                    >
                      Cancelar
                    </button>
                  </ng-container>

                  <!-- Transición EN_ESPERA -> EN_ATENCION o CANCELADA -->
                  <ng-container *ngIf="a.estado === 'EN_ESPERA'">
                    <button
                      type="button"
                      class="btn-op btn-op-attend"
                      (click)="cambiarEstado(a.id, 'EN_ATENCION')"
                      [disabled]="procesandoId === a.id"
                    >
                      Llamar a Consulta
                    </button>
                    <button
                      type="button"
                      class="btn-op btn-op-cancel"
                      (click)="cambiarEstado(a.id, 'CANCELADA')"
                      [disabled]="procesandoId === a.id"
                    >
                      Cancelar
                    </button>
                  </ng-container>

                  <!-- Transición EN_ATENCION -> CERRADA -->
                  <ng-container *ngIf="a.estado === 'EN_ATENCION'">
                    <button
                      type="button"
                      class="btn-op btn-op-close"
                      (click)="cambiarEstado(a.id, 'CERRADA')"
                      [disabled]="procesandoId === a.id"
                    >
                      Finalizar Atención
                    </button>
                  </ng-container>

                  <!-- Estado final CERRADA / CANCELADA -->
                  <span *ngIf="a.estado === 'CERRADA' || a.estado === 'CANCELADA'" class="text-subtle">
                    Sin acciones pendientes
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #sinAtencionesAdmin>
          <div class="empty-state">
            <span class="empty-icon">&#10003;</span>
            <h3>No se encontraron atenciones</h3>
            <p>No hay solicitudes que coincidan con el filtro actual o la búsqueda ingresada.</p>
          </div>
        </ng-template>
      </section>
    </ng-container>
  `
})
export class AppointmentsComponent implements OnInit {
  atenciones: Appointment[] = [];
  catalogo: ClinicalService[] = [];
  yo: UserProfile | null = null;

  // Modo de vista ('auto', 'paciente', 'admin')
  vistaModo: 'auto' | 'paciente' | 'admin' = 'auto';

  // Formulario de nueva cita
  nuevoPacienteNombre: string = '';
  nuevoServicioId: number | null = null;
  guardandoCita: boolean = false;
  procesandoId: number | null = null;

  // Filtros Admin
  filtroEstado: string = 'TODAS';
  terminoBusqueda: string = '';

  // Mensajes
  exitoMensaje: string = '';
  errorMensaje: string = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.api.getMe().subscribe({
      next: r => {
        this.yo = r;
        if (r.nombre && !this.nuevoPacienteNombre) {
          this.nuevoPacienteNombre = r.nombre;
        }
      },
      error: err => console.warn('No se pudo obtener información del usuario:', err)
    });

    this.api.getCatalog().subscribe({
      next: list => {
        this.catalogo = list || [];
        if (this.catalogo.length > 0 && !this.nuevoServicioId) {
          this.nuevoServicioId = this.catalogo[0].id;
        }
      },
      error: err => console.warn('No se pudo cargar el catálogo:', err)
    });

    this.recargarAtenciones();
  }

  recargarAtenciones(): void {
    this.api.getAppointments().subscribe({
      next: r => this.atenciones = r || [],
      error: err => {
        console.warn('Error al cargar atenciones:', err);
        this.errorMensaje = 'No se pudieron cargar las atenciones. Revisa tu conexión o sesión.';
      }
    });
  }

  get esAdmin(): boolean {
    return this.yo?.roles?.some(r => r === 'Admin' || r === 'Recepcionista') ?? false;
  }

  get modoActivo(): 'paciente' | 'admin' {
    if (this.vistaModo !== 'auto') {
      return this.vistaModo;
    }
    return this.esAdmin ? 'admin' : 'paciente';
  }

  get misAtenciones(): Appointment[] {
    if (!this.yo?.nombre) {
      return this.atenciones;
    }
    const nombreLower = this.yo.nombre.trim().toLowerCase();
    const filtradas = this.atenciones.filter(a =>
      a.pacienteNombre?.toLowerCase().includes(nombreLower) ||
      nombreLower.includes(a.pacienteNombre?.toLowerCase())
    );
    // Si no coincide exactamente por diferencias de tildes o mayúsculas y hay atenciones, mostramos las registradas
    return filtradas.length > 0 ? filtradas : this.atenciones;
  }

  get proximaAtencion(): Appointment | undefined {
    return this.misAtenciones.find(a =>
      a.estado === 'SOLICITADA' || a.estado === 'CONFIRMADA' || a.estado === 'EN_ESPERA' || a.estado === 'EN_ATENCION'
    );
  }

  get atencionesFiltradasAdmin(): Appointment[] {
    let lista = this.atenciones;
    if (this.filtroEstado !== 'TODAS') {
      lista = lista.filter(a => a.estado === this.filtroEstado);
    }
    if (this.terminoBusqueda.trim()) {
      const q = this.terminoBusqueda.toLowerCase().trim();
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

  getEstadoLegible(estado: string): string {
    switch (estado) {
      case 'SOLICITADA': return 'Solicitud en Revisión';
      case 'CONFIRMADA': return 'Hora Confirmada';
      case 'EN_ESPERA': return 'En Sala de Espera';
      case 'EN_ATENCION': return 'En Consulta Médica';
      case 'CERRADA': return 'Atención Finalizada';
      case 'CANCELADA': return 'Cita Cancelada';
      default: return estado;
    }
  }

  formatearPrecio(valor?: number): string {
    if (valor === undefined || valor === null) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatearFecha(fechaIso?: string): string {
    if (!fechaIso) return 'Reciente';
    try {
      const d = new Date(fechaIso);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaIso;
    }
  }

  seleccionarServicioParaAgendar(servicioId: number): void {
    this.nuevoServicioId = servicioId;
    const el = document.getElementById('seccion-agendar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  agendarCita(): void {
    if (!this.nuevoServicioId || !this.nuevoPacienteNombre.trim()) {
      this.errorMensaje = 'Por favor ingresa tu nombre y selecciona una prestación médica.';
      return;
    }

    const servicio = this.catalogo.find(s => s.id === this.nuevoServicioId);
    this.guardandoCita = true;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    this.api.createAppointment({
      pacienteNombre: this.nuevoPacienteNombre.trim(),
      servicioId: this.nuevoServicioId,
      boxId: servicio?.boxId || 1
    }).subscribe({
      next: nueva => {
        this.guardandoCita = false;
        this.exitoMensaje = `¡Cita médica solicitada con éxito para ${nueva.pacienteNombre}! Tu solicitud está en revisión.`;
        this.recargarAtenciones();
      },
      error: err => {
        this.guardandoCita = false;
        console.error('Error al agendar cita:', err);
        this.errorMensaje = 'Ocurrió un error al registrar la cita médica. Inténtalo nuevamente.';
      }
    });
  }

  cambiarEstado(id: number, nuevoEstado: string): void {
    this.procesandoId = id;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    this.api.updateAppointmentStatus(id, nuevoEstado).subscribe({
      next: actual => {
        this.procesandoId = null;
        this.exitoMensaje = `Atención #${actual.id} actualizada al estado ${actual.estado}.`;
        this.recargarAtenciones();
      },
      error: err => {
        this.procesandoId = null;
        console.error('Error al cambiar estado:', err);
        this.errorMensaje = `No se pudo cambiar el estado de la atención #${id}. Verifica si la transición es permitida.`;
      }
    });
  }
}
