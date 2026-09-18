import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Appointment, ClinicalService, UserProfile } from '../api.service';
import { AdminPanelComponent } from '../admin/admin-panel.component';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPanelComponent],
  template: `
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
      <section class="dashboard-hero">
        <div class="page-heading">
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
                class="form-control form-control-readonly"
                [value]="yo?.nombre || ''"
                readonly
                disabled
              />
              <small class="text-subtle">👤 Paciente: {{ yo?.nombre }} (Sesión verificada ✓)</small>
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

            <div class="form-group">
              <label for="fechaCita">Fecha de la cita</label>
              <input
                id="fechaCita"
                type="date"
                class="form-control"
                [(ngModel)]="nuevaFecha"
                name="fechaCita"
                [min]="fechaMinima"
                required
              />
            </div>

            <div class="form-group form-group-full">
              <label>Horario disponible</label>
              <div class="time-chips">
                <button
                  type="button"
                  *ngFor="let hora of bloquesHorario"
                  class="time-chip"
                  [class.selected]="nuevaHora === hora"
                  (click)="nuevaHora = hora"
                >
                  {{ hora }}
                </button>
              </div>
            </div>
          </div>

          <div class="booking-summary" *ngIf="nuevoServicioId && nuevaFecha && nuevaHora">
            <span class="booking-summary-icon" aria-hidden="true">📋</span>
            <span>
              Vas a reservar <strong>{{ getServicioNombre(nuevoServicioId) }}</strong>
              para el <strong>{{ formatearFechaCorta(nuevaFecha) }}</strong>
              a las <strong>{{ nuevaHora }} hrs</strong>.
            </span>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="button button-primary"
              [disabled]="guardandoCita || !nuevoServicioId || !yo?.nombre || !nuevaFecha || !nuevaHora"
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
                <th>Cita Agendada Para</th>
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
                <td>{{ formatearFechaHoraCita(a.fechaHora) }}</td>
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
    <!-- 2. VISTA DE RECEPCIONISTA (PANEL OPERATIVO)                              -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="modoActivo === 'recepcion'">
      <div class="admin-console">
      <section class="dashboard-hero dashboard-hero-admin">
        <div class="page-heading">
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
            <p>Lista general de pacientes y actualización de estados en tiempo real · Actualizado {{ ultimaActualizacion }}</p>
          </div>
          <div class="admin-filters">
            <input
              type="text"
              class="search-input"
              [(ngModel)]="terminoBusqueda"
              placeholder="Buscar por paciente o ID..."
            />
            <button type="button" class="button-quiet btn-refresh" (click)="recargarAtenciones()" [disabled]="actualizando">
              <span [class.spin]="actualizando" aria-hidden="true">⟳</span>
              {{ actualizando ? 'Actualizando…' : 'Actualizar' }}
            </button>
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
                <th>Cita Agendada Para</th>
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
                <td>{{ formatearFechaHoraCita(a.fechaHora) }}</td>
                <td>
                  <span class="status-badge" [ngClass]="'badge-' + a.estado.toLowerCase()">
                    {{ a.estado }}
                  </span>
                </td>
                <td class="td-actions">
                  <div class="td-actions-inner">
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
                  </div>
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
      </div>
    </ng-container>

    <!-- ========================================================================= -->
    <!-- 3. VISTA DE ADMINISTRADOR (GESTIÓN DE CATÁLOGO, MÉTRICAS Y SUPERVISIÓN)  -->
    <!-- ========================================================================= -->
    <ng-container *ngIf="modoActivo === 'admin'">
      <div class="admin-console">
        <app-admin-panel [atenciones]="atenciones" [yo]="yo"></app-admin-panel>
      </div>
    </ng-container>
  `
})
export class AppointmentsComponent implements OnInit {
  atenciones: Appointment[] = [];
  catalogo: ClinicalService[] = [];
  yo: UserProfile | null = null;
  actualizando: boolean = false;
  ultimaActualizacion: string = 'hace instantes';

  // Formulario de nueva cita
  nuevoServicioId: number | null = null;
  nuevaFecha: string = '';
  nuevaHora: string = '';
  guardandoCita: boolean = false;
  procesandoId: number | null = null;

  readonly bloquesHorario: string[] = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '15:00', '15:30', '16:00', '16:30'
  ];

  readonly fechaMinima: string = (() => {
    const hoy = new Date();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${hoy.getFullYear()}-${mm}-${dd}`;
  })();

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
    this.actualizando = true;
    this.api.getAppointments().subscribe({
      next: r => {
        this.atenciones = r || [];
        this.actualizando = false;
        this.ultimaActualizacion = 'hace instantes';
      },
      error: err => {
        console.warn('Error al cargar atenciones:', err);
        this.errorMensaje = 'No se pudieron cargar las atenciones. Revisa tu conexión o sesión.';
        this.actualizando = false;
      }
    });
  }

  get esAdminRole(): boolean {
    return this.yo?.roles?.includes('Admin') ?? false;
  }

  get esRecepcionista(): boolean {
    return this.yo?.roles?.includes('Recepcionista') ?? false;
  }

  get modoActivo(): 'paciente' | 'recepcion' | 'admin' {
    if (this.esAdminRole) return 'admin';
    if (this.esRecepcionista) return 'recepcion';
    return 'paciente';
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

  formatearFechaCorta(fechaIso: string): string {
    try {
      const [anio, mes, dia] = fechaIso.split('-').map(Number);
      const d = new Date(anio, mes - 1, dia);
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long' });
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
    const nombrePaciente = this.yo?.nombre?.trim();
    if (!this.nuevoServicioId || !nombrePaciente || !this.nuevaFecha || !this.nuevaHora) {
      this.errorMensaje = 'No se pudo verificar tu sesión. Vuelve a iniciar sesión y selecciona especialidad, fecha y horario.';
      return;
    }

    const servicio = this.catalogo.find(s => s.id === this.nuevoServicioId);
    this.guardandoCita = true;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    this.api.createAppointment({
      pacienteNombre: nombrePaciente,
      servicioId: this.nuevoServicioId,
      boxId: servicio?.boxId || 1,
      fechaHora: `${this.nuevaFecha}T${this.nuevaHora}:00`
    }).subscribe({
      next: nueva => {
        this.guardandoCita = false;
        this.exitoMensaje = `¡Cita médica solicitada con éxito para ${nueva.pacienteNombre}, agendada para el ${this.formatearFechaHoraCita(nueva.fechaHora)}!`;
        this.nuevaFecha = '';
        this.nuevaHora = '';
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
