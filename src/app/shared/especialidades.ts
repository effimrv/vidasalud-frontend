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
  },
  {
    slug: 'dermatologia',
    nombre: 'Dermatología',
    descripcion: 'Diagnóstico y tratamiento de afecciones de la piel, control de lunares y salud dermatológica.',
    precio: '$20.000',
    box: 'Box 5',
    icono: '🧴'
  },
  {
    slug: 'ginecologia',
    nombre: 'Ginecología y Salud de la Mujer',
    descripcion: 'Controles ginecológicos preventivos, salud reproductiva y seguimiento integral de la mujer.',
    precio: '$25.000',
    box: 'Box 6',
    icono: '🌸'
  }
];
