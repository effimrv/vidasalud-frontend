import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Appointment, ClinicalService, UserProfile } from '../api.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html'
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

  get citasPorEspecialidad(): { nombre: string; cantidad: number; porcentaje: number }[] {
    if (this.atenciones.length === 0) return [];

    const conteoPorServicio = new Map<number, number>();
    for (const a of this.atenciones) {
      conteoPorServicio.set(a.servicioId, (conteoPorServicio.get(a.servicioId) || 0) + 1);
    }

    const maxConteo = Math.max(...conteoPorServicio.values());
    return Array.from(conteoPorServicio.entries())
      .map(([servicioId, cantidad]) => ({
        nombre: this.getServicioNombre(servicioId),
        cantidad,
        porcentaje: Math.round((cantidad / maxConteo) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  get citasPorEstado(): { estado: string; etiqueta: string; cantidad: number; porcentaje: number }[] {
    const estados: { estado: string; etiqueta: string }[] = [
      { estado: 'SOLICITADA', etiqueta: 'Solicitadas' },
      { estado: 'CONFIRMADA', etiqueta: 'Confirmadas' },
      { estado: 'EN_ESPERA', etiqueta: 'En Espera' },
      { estado: 'EN_ATENCION', etiqueta: 'En Consulta' },
      { estado: 'CERRADA', etiqueta: 'Cerradas' },
      { estado: 'CANCELADA', etiqueta: 'Canceladas' }
    ];

    const conteos = estados.map(e => this.countPorEstado(e.estado));
    const maxConteo = Math.max(...conteos, 1);

    return estados.map((e, i) => ({
      ...e,
      cantidad: conteos[i],
      porcentaje: Math.round((conteos[i] / maxConteo) * 100)
    }));
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
