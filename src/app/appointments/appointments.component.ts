import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout, catchError, of, interval } from 'rxjs';
import {
  ApiService, Appointment, BloqueHorario, ClinicalService, EstadoAtencion, InstitutionalInfo, UserProfile
} from '../api.service';
import { AdminPanelComponent } from '../admin/admin-panel.component';
import { DetalleCitaComponent } from '../shared/detalle-cita.component';
import { ProgresoCitaComponent } from '../shared/progreso-cita.component';
import { ESPECIALIDADES } from '../shared/especialidades';
import { describirErrorHttp } from '../shared/mensajes-error';
import { informeMedico, InformeMedico } from '../shared/informes-medicos';
import {
  ESTADOS_CANCELABLES, ESTADOS_EN_CURSO, estadoCorto, estadoLegible, formatearFechaHoraCita, formatearFechaHoraSolicitud,
  formatearPrecio, haceCuanto
} from '../shared/formato';

/** Cada cuánto se sincronizan las citas con el servidor (las vistas muestran el estado real en vivo). */
const REFRESCO_MS = 5000;
/** Cuánto permanece visible un aviso de cambio de estado. */
const DURACION_AVISO_MS = 7000;

interface AvisoCambio {
  id: number;
  texto: string;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPanelComponent, DetalleCitaComponent, ProgresoCitaComponent],
  templateUrl: './appointments.component.html'
})
export class AppointmentsComponent implements OnInit {
  atenciones: Appointment[] = [];
  catalogo: ClinicalService[] = [];
  yo: UserProfile | null = null;
  /** true en cuanto getMe() responde (con éxito o error), para no dejar el loader de rol pegado si la llamada falla. */
  rolResuelto = false;
  infoInstitucional: InstitutionalInfo | null = null;
  actualizando = false;
  /** Instante (ms) de la última sincronización correcta con el servidor. */
  ultimaSincronizacion = 0;

  // Formulario de nueva cita
  nuevoServicioId: number | null = null;
  nuevaFecha = '';
  nuevaHora = '';
  bloques: BloqueHorario[] = [];
  cargandoBloques = false;
  guardandoCita = false;
  procesandoId: number | null = null;

  readonly fechaMinima: string = (() => {
    const hoy = new Date();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${hoy.getFullYear()}-${mm}-${dd}`;
  })();

  // Filtros de recepción
  filtroEstado = 'TODAS';
  terminoBusqueda = '';

  // Filtro de estado (paciente)
  filtroEstadoPaciente = 'TODAS';
  mostrarTodasMisAtenciones = false;
  readonly limiteMisAtenciones = 3;

  // Detalle de cita abierto (paciente o recepción)
  atencionDetalleId: number | null = null;

  // Mensajes
  exitoMensaje = '';
  errorMensaje = '';
  avisos: AvisoCambio[] = [];
  private estadosConocidos = new Map<number, EstadoAtencion>();
  private siguienteAviso = 0;

  readonly estadoLegible = estadoLegible;
  readonly estadoCorto = estadoCorto;
  readonly formatearPrecio = formatearPrecio;
  readonly formatearFechaHoraCita = formatearFechaHoraCita;
  readonly formatearFechaHoraSolicitud = formatearFechaHoraSolicitud;
  readonly haceCuanto = haceCuanto;
  readonly informeMedico: (a: Appointment) => InformeMedico = informeMedico;

  constructor(private api: ApiService, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    this.cargarDatos();
    interval(REFRESCO_MS).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sincronizar());
  }

  cargarDatos(): void {
    this.api.getMe().pipe(
      timeout(10000),
      catchError(err => {
        console.warn('No se pudo obtener información del usuario:', err);
        return of(null);
      })
    ).subscribe(r => {
      this.yo = r;
      this.rolResuelto = true;
    });

    this.api.getCatalog().subscribe({
      next: list => {
        this.catalogo = list || [];
        if (this.catalogo.length > 0 && !this.nuevoServicioId) {
          this.nuevoServicioId = this.catalogo[0].id;
        }
      },
      error: err => {
        console.warn('No se pudo cargar el catálogo:', err);
        this.errorMensaje ||= describirErrorHttp(err, 'cargar las especialidades disponibles');
      }
    });

    this.api.getInfoInstitucional().subscribe({
      next: info => this.infoInstitucional = info,
      error: err => console.warn('No se pudo cargar la información institucional:', err)
    });

    this.recargarAtenciones();
  }

  /** Recarga las citas. En modo silencioso (sincronización periódica) no muestra el indicador de carga. */
  recargarAtenciones(silencioso = false): void {
    if (!silencioso) this.actualizando = true;
    this.api.getAppointments().subscribe({
      next: r => {
        this.registrarCambios(r || []);
        this.atenciones = r || [];
        this.actualizando = false;
        this.ultimaSincronizacion = Date.now();
      },
      error: err => {
        console.warn('Error al cargar atenciones:', err);
        if (!silencioso) this.errorMensaje = describirErrorHttp(err, 'cargar tus atenciones');
        this.actualizando = false;
      }
    });
  }

  /** Sincronización periódica: estado de las citas y, si se está agendando, las horas que se van ocupando. */
  private sincronizar(): void {
    if (!this.rolResuelto || document.hidden) return;
    this.recargarAtenciones(true);
    if (this.modoActivo === 'paciente' && this.nuevoServicioId && this.nuevaFecha) {
      this.cargarDisponibilidad(true);
    }
  }

  /** Avisa al paciente cuando una de sus citas cambia de estado (lo hace el flujo automático del centro). */
  private registrarCambios(nuevas: Appointment[]): void {
    const primeraCarga = this.estadosConocidos.size === 0;
    for (const a of nuevas) {
      const anterior = this.estadosConocidos.get(a.id);
      if (!primeraCarga && anterior && anterior !== a.estado && this.modoActivo === 'paciente') {
        this.mostrarAviso(`Tu cita #${a.id} de ${this.getServicioNombre(a.servicioId)} pasó a: ${estadoLegible(a.estado)}`);
      }
      this.estadosConocidos.set(a.id, a.estado);
    }
  }

  private mostrarAviso(texto: string): void {
    const aviso = { id: ++this.siguienteAviso, texto };
    this.avisos = [...this.avisos, aviso];
    setTimeout(() => this.cerrarAviso(aviso.id), DURACION_AVISO_MS);
  }

  cerrarAviso(id: number): void {
    this.avisos = this.avisos.filter(a => a.id !== id);
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

  get textoSincronizacion(): string {
    return this.ultimaSincronizacion ? haceCuanto(new Date(this.ultimaSincronizacion).toISOString()) : 'cargando…';
  }

  /** Nombre formal del paciente para la cita (nombre y apellido); si no está, el nombre para mostrar. */
  get nombreFicha(): string {
    return (this.yo?.nombreCompleto || this.yo?.nombre || '').trim();
  }

  // ===== Vista del paciente =====

  /** Para un paciente, el BFF ya devuelve solo sus propias atenciones (filtradas por su identidad en Entra ID). */
  get misAtenciones(): Appointment[] {
    return this.ordenarPorMasReciente(this.atenciones);
  }

  get misAtencionesFiltradas(): Appointment[] {
    if (this.filtroEstadoPaciente === 'TODAS') {
      return this.misAtenciones;
    }
    return this.misAtenciones.filter(a => a.estado === this.filtroEstadoPaciente);
  }

  get misAtencionesVisibles(): Appointment[] {
    return this.mostrarTodasMisAtenciones
      ? this.misAtencionesFiltradas
      : this.misAtencionesFiltradas.slice(0, this.limiteMisAtenciones);
  }

  countMisAtencionesPorEstado(estado: string): number {
    return this.misAtenciones.filter(a => a.estado === estado).length;
  }

  seleccionarFiltroPaciente(estado: string): void {
    this.filtroEstadoPaciente = estado;
    this.mostrarTodasMisAtenciones = false;
  }

  get proximaAtencion(): Appointment | undefined {
    return this.misAtenciones.find(a => ESTADOS_EN_CURSO.includes(a.estado));
  }

  // ===== Vista de recepción =====

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
    return this.ordenarPorMasReciente(lista);
  }

  countPorEstado(estado: string): number {
    return this.atenciones.filter(a => a.estado === estado).length;
  }

  esCancelable(a: Appointment): boolean {
    return ESTADOS_CANCELABLES.includes(a.estado);
  }

  // ===== Agenda =====

  /** Al cambiar la prestación o la fecha se consultan las horas disponibles de ese día. */
  alCambiarAgenda(): void {
    this.nuevaHora = '';
    this.cargarDisponibilidad();
  }

  cargarDisponibilidad(silencioso = false): void {
    if (!this.nuevoServicioId || !this.nuevaFecha) {
      this.bloques = [];
      return;
    }
    if (!silencioso) this.cargandoBloques = true;
    this.api.getDisponibilidad(this.nuevoServicioId, this.nuevaFecha).subscribe({
      next: bloques => {
        this.bloques = bloques;
        this.cargandoBloques = false;
        // Si la hora elegida se ocupó mientras el paciente decidía, se deselecciona.
        if (this.nuevaHora && !bloques.some(b => b.hora === this.nuevaHora && b.disponible)) {
          this.nuevaHora = '';
          if (silencioso) this.errorMensaje = 'La hora que habías elegido acaba de ser reservada por otro paciente. Elige otra.';
        }
      },
      error: err => {
        this.cargandoBloques = false;
        if (!silencioso) this.errorMensaje = describirErrorHttp(err, 'consultar las horas disponibles');
      }
    });
  }

  get horasDisponibles(): number {
    return this.bloques.filter(b => b.disponible).length;
  }

  seleccionarServicioParaAgendar(servicioId: number): void {
    this.nuevoServicioId = servicioId;
    this.alCambiarAgenda();
    document.getElementById('seccion-agendar')?.scrollIntoView({ behavior: 'smooth' });
  }

  agendarCita(): void {
    const nombrePaciente = this.nombreFicha;
    if (!this.nuevoServicioId || !nombrePaciente || !this.nuevaFecha || !this.nuevaHora) {
      this.errorMensaje = 'Selecciona especialidad, fecha y una hora disponible para continuar.';
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
        this.exitoMensaje = `¡Solicitud registrada! Tu cita #${nueva.id} para el ${formatearFechaHoraCita(nueva.fechaHora)} `
          + 'está en revisión automática; verás aquí cómo avanza.';
        this.nuevaHora = '';
        this.recargarAtenciones();
        this.cargarDisponibilidad(true);
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoCita = false;
        console.error('Error al agendar cita:', err);
        this.errorMensaje = err.status === 409
          ? 'Esa hora acaba de ser reservada por otro paciente. Elige otra de las disponibles.'
          : describirErrorHttp(err, 'registrar la cita médica');
        this.cargarDisponibilidad(true);
      }
    });
  }

  // ===== Acciones sobre una cita =====

  verDetalle(id: number): void {
    this.atencionDetalleId = id;
  }

  cerrarDetalle(): void {
    this.atencionDetalleId = null;
  }

  cancelarCita(a: Appointment): void {
    this.procesandoId = a.id;
    this.errorMensaje = '';
    this.exitoMensaje = '';

    this.api.updateAppointmentStatus(a.id, 'CANCELADA').subscribe({
      next: actual => {
        this.procesandoId = null;
        this.exitoMensaje = `La cita #${actual.id} fue cancelada y su hora quedó disponible.`;
        this.recargarAtenciones();
      },
      error: err => {
        this.procesandoId = null;
        console.error('Error al cancelar la cita:', err);
        this.errorMensaje = err?.status === 400
          ? `La cita #${a.id} ya no se puede cancelar: su estado cambió.`
          : describirErrorHttp(err, `cancelar la cita #${a.id}`);
      }
    });
  }

  // ===== Apoyo para la vista =====

  getServicioNombre(servicioId: number): string {
    const serv = this.catalogo.find(s => s.id === servicioId);
    return serv ? serv.nombre : `Servicio #${servicioId}`;
  }

  getServicioPrecio(servicioId: number): number | undefined {
    return this.catalogo.find(s => s.id === servicioId)?.precio;
  }

  getDescripcionServicio(nombre: string): string {
    const especialidad = ESPECIALIDADES.find(e => e.nombre === nombre);
    return especialidad?.descripcion ?? 'Atención médica especializada en esta prestación.';
  }

  getImagenServicio(nombre: string): string | null {
    return ESPECIALIDADES.find(e => e.nombre === nombre)?.imagen ?? null;
  }

  formatearFechaCorta(fechaIso: string): string {
    const [anio, mes, dia] = fechaIso.split('-').map(Number);
    const d = new Date(anio, mes - 1, dia);
    return isNaN(d.getTime()) ? fechaIso : d.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  private ordenarPorMasReciente(lista: Appointment[]): Appointment[] {
    return [...lista].sort((a, b) => {
      const fechaA = a.creadaEn ? new Date(a.creadaEn).getTime() : 0;
      const fechaB = b.creadaEn ? new Date(b.creadaEn).getTime() : 0;
      return fechaB - fechaA || b.id - a.id;
    });
  }
}
