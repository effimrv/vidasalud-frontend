import { EstadoAtencion } from '../api.service';

/** Pasos del recorrido normal de una cita, en orden (CANCELADA queda fuera del recorrido). */
export const PASOS_CITA: { estado: EstadoAtencion; etiqueta: string }[] = [
  { estado: 'SOLICITADA', etiqueta: 'Solicitada' },
  { estado: 'CONFIRMADA', etiqueta: 'Confirmada' },
  { estado: 'EN_ESPERA', etiqueta: 'En espera' },
  { estado: 'EN_ATENCION', etiqueta: 'En consulta' },
  { estado: 'CERRADA', etiqueta: 'Finalizada' }
];

export const ESTADOS_EN_CURSO: EstadoAtencion[] = ['SOLICITADA', 'CONFIRMADA', 'EN_ESPERA', 'EN_ATENCION'];

/** Estados en los que la cita todavía se puede cancelar (antes de entrar a consulta). */
export const ESTADOS_CANCELABLES: EstadoAtencion[] = ['SOLICITADA', 'CONFIRMADA', 'EN_ESPERA'];

export function estadoLegible(estado: string): string {
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

/** Índice del paso actual en PASOS_CITA (-1 si la cita está cancelada). */
export function indicePaso(estado: string): number {
  return PASOS_CITA.findIndex(p => p.estado === estado);
}

export function formatearPrecio(valor?: number): string {
  if (valor === undefined || valor === null) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
}

/** "23 oct, 10:30 hrs" */
export function formatearFechaHoraCita(fechaHora?: string): string {
  if (!fechaHora) return 'Por confirmar';
  const d = new Date(fechaHora);
  if (isNaN(d.getTime())) return fechaHora;
  const dia = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dia}, ${hora} hrs`;
}

/** "23 oct a las 10:30 hrs" */
export function formatearFechaHoraSolicitud(instante?: string): string {
  if (!instante) return 'Fecha no disponible';
  const d = new Date(instante);
  if (isNaN(d.getTime())) return instante;
  const dia = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return `${dia} a las ${hora} hrs`;
}

/** "hace 12 s", "hace 3 min", "hace 2 h" (o la fecha si pasó más de un día). */
export function haceCuanto(instante?: string, ahora: number = Date.now()): string {
  if (!instante) return '';
  const ms = ahora - new Date(instante).getTime();
  if (isNaN(ms)) return '';
  const segundos = Math.max(0, Math.round(ms / 1000));
  if (segundos < 60) return `hace ${segundos} s`;
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return formatearFechaHoraSolicitud(instante);
}
