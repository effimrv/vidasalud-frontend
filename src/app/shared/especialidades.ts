export interface EspecialidadDestacada {
  slug: string;
  nombre: string;
  descripcion: string;
  precio: string;
  box: string;
  icono: string;
}

export const ESPECIALIDADES: EspecialidadDestacada[] = [
  {
    slug: 'medicina-general',
    nombre: 'Medicina General',
    descripcion: 'Evaluación clínica integral, diagnósticos preventivos y tratamiento de patologías frecuentes.',
    precio: '$15.000',
    box: 'Box 1',
    icono: '🩺'
  },
  {
    slug: 'pediatria',
    nombre: 'Pediatría y Control Niño Sano',
    descripcion: 'Atención especializada para recién nacidos, niños y adolescentes con enfoque preventivo.',
    precio: '$22.000',
    box: 'Box 2',
    icono: '👶'
  },
  {
    slug: 'kinesiologia',
    nombre: 'Kinesiología y Rehabilitación',
    descripcion: 'Recuperación funcional motora, terapia respiratoria y tratamiento músculo-esquelético.',
    precio: '$18.000',
    box: 'Box 3',
    icono: '🏃'
  },
  {
    slug: 'cardiologia',
    nombre: 'Cardiología Preventiva',
    descripcion: 'Chequeos cardiovasculares, control de hipertensión y evaluaciones médicas de esfuerzo.',
    precio: '$28.000',
    box: 'Box 4',
    icono: '❤️'
  }
];
