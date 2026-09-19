import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, of } from 'rxjs';
import { ApiService, Appointment, ClinicalService, InstitutionalInfo, UserProfile } from '../api.service';
import { AdminPanelComponent } from '../admin/admin-panel.component';
import { ESPECIALIDADES } from '../shared/especialidades';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPanelComponent],
  templateUrl: './appointments.component.html'
})
export class AppointmentsComponent implements OnInit {
  atenciones: Appointment[] = [];
  catalogo: ClinicalService[] = [];
  yo: UserProfile | null = null;
  /** true en cuanto getMe() responde (con éxito o error), para no dejar el loader de rol pegado si la llamada falla. */
  rolResuelto: boolean = false;
  infoInstitucional: InstitutionalInfo | null = null;
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

  // Filtro de estado (Paciente)
  filtroEstadoPaciente: string = 'TODAS';
  mostrarTodasMisAtenciones: boolean = false;
  readonly limiteMisAtenciones: number = 2;

  // Mensajes
  exitoMensaje: string = '';
  errorMensaje: string = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
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
      error: err => console.warn('No se pudo cargar el catálogo:', err)
    });

    this.api.getInfoInstitucional().subscribe({
      next: info => this.infoInstitucional = info,
      error: err => console.warn('No se pudo cargar la información institucional:', err)
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
    const nombreSesion = this.normalizarNombre(this.yo?.nombre);
    if (!nombreSesion) {
      return [];
    }
    const propias = this.atenciones.filter(a => this.normalizarNombre(a.pacienteNombre) === nombreSesion);
    return this.ordenarPorMasReciente(propias);
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

  private normalizarNombre(nombre?: string | null): string {
    return (nombre ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
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
    return this.ordenarPorMasReciente(lista);
  }

  private ordenarPorMasReciente(lista: Appointment[]): Appointment[] {
    return [...lista].sort((a, b) => {
      const fechaA = a.creadaEn ? new Date(a.creadaEn).getTime() : 0;
      const fechaB = b.creadaEn ? new Date(b.creadaEn).getTime() : 0;
      return fechaB - fechaA || b.id - a.id;
    });
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

  getDescripcionServicio(nombre: string): string {
    const especialidad = ESPECIALIDADES.find(e => e.nombre === nombre);
    return especialidad?.descripcion ?? 'Atención médica especializada en esta prestación.';
  }

  getImagenServicio(nombre: string): string | null {
    const especialidad = ESPECIALIDADES.find(e => e.nombre === nombre);
    return especialidad?.imagen ?? null;
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

  formatearFechaHoraSolicitud(creadaEn?: string): string {
    if (!creadaEn) return 'Fecha no disponible';
    try {
      const d = new Date(creadaEn);
      const dia = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
      const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${dia} a las ${hora} hrs`;
    } catch {
      return creadaEn;
    }
  }

  private readonly informesPorEspecialidad: Record<number, { diagnostico: string; indicaciones: string; medicos: string[] }[]> = {
    1: [
      { diagnostico: 'Cuadro gripal leve con buena evolución clínica', indicaciones: 'Reposo relativo por 48 horas, hidratación abundante y control SOS si persisten los síntomas.', medicos: ['Dr. Roberto Silva - Med. General', 'Dra. Camila Torres - Med. General'] },
      { diagnostico: 'Control de salud general - Parámetros dentro de rango normal', indicaciones: 'Mantener hábitos alimenticios saludables y actividad física regular. Próximo control en 6 meses.', medicos: ['Dr. Roberto Silva - Med. General', 'Dra. Camila Torres - Med. General'] }
    ],
    2: [
      { diagnostico: 'Control de niño sano - Desarrollo acorde a la edad', indicaciones: 'Continuar esquema de vacunación según calendario. Control en 3 meses.', medicos: ['Dra. Fernanda Muñoz - Pediatra', 'Dr. Sebastián Rojas - Pediatra'] },
      { diagnostico: 'Rinofaringitis aguda leve - Buena evolución', indicaciones: 'Abundante hidratación, lavado nasal con suero fisiológico y control si hay fiebre persistente.', medicos: ['Dra. Fernanda Muñoz - Pediatra', 'Dr. Sebastián Rojas - Pediatra'] }
    ],
    3: [
      { diagnostico: 'Contractura muscular lumbar - Mejoría tras la sesión', indicaciones: 'Aplicar calor local, evitar cargar peso y continuar los ejercicios de elongación indicados.', medicos: ['Klgo. Matías Bravo - Kinesiología', 'Klga. Valentina Soto - Kinesiología'] },
      { diagnostico: 'Rehabilitación post-esguince de tobillo - Evolución favorable', indicaciones: 'Continuar ejercicios de fortalecimiento progresivo. Próxima sesión en 1 semana.', medicos: ['Klgo. Matías Bravo - Kinesiología', 'Klga. Valentina Soto - Kinesiología'] }
    ],
    4: [
      { diagnostico: 'Evaluación preventiva cardiovascular en rango normal', indicaciones: 'Mantener control de presión arterial en casa y dieta baja en sodio. Control en 6 meses.', medicos: ['Dr. Andrés Fuentes - Cardiólogo', 'Dra. Paula Contreras - Cardióloga'] },
      { diagnostico: 'Control de presión arterial - Estable, sin hallazgos relevantes', indicaciones: 'Continuar tratamiento indicado y actividad física moderada. Control en 3 meses.', medicos: ['Dr. Andrés Fuentes - Cardiólogo', 'Dra. Paula Contreras - Cardióloga'] }
    ],
    5: [
      { diagnostico: 'Dermatitis leve - Buena respuesta a tratamiento tópico', indicaciones: 'Aplicar la crema indicada dos veces al día y evitar la exposición solar directa.', medicos: ['Dra. Josefina Vargas - Dermatóloga', 'Dr. Ignacio Peña - Dermatólogo'] },
      { diagnostico: 'Control dermatológico preventivo - Sin lesiones sospechosas', indicaciones: 'Uso diario de protector solar y control anual de lunares.', medicos: ['Dra. Josefina Vargas - Dermatóloga', 'Dr. Ignacio Peña - Dermatólogo'] }
    ],
    6: [
      { diagnostico: 'Control ginecológico preventivo - Resultados normales', indicaciones: 'Continuar controles anuales de rutina. Sin indicaciones adicionales.', medicos: ['Dra. Antonia Reyes - Ginecóloga', 'Dra. Constanza Díaz - Ginecóloga'] },
      { diagnostico: 'Evaluación de salud reproductiva - Sin hallazgos relevantes', indicaciones: 'Mantener controles periódicos según indicación médica.', medicos: ['Dra. Antonia Reyes - Ginecóloga', 'Dra. Constanza Díaz - Ginecóloga'] }
    ]
  };

  getInformeMedico(a: Appointment): { diagnostico: string; indicaciones: string; medico: string } {
    const opciones = this.informesPorEspecialidad[a.servicioId] || this.informesPorEspecialidad[1];
    const opcion = opciones[a.id % opciones.length];
    const medico = opcion.medicos[a.id % opcion.medicos.length];
    return { diagnostico: opcion.diagnostico, indicaciones: opcion.indicaciones, medico };
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
