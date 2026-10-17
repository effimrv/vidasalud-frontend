import { Appointment } from '../api.service';

export interface InformeMedico {
  diagnostico: string;
  indicaciones: string;
  medico: string;
}

/** Informes de ejemplo por especialidad: simulan el informe que entrega el médico al cerrar la atención. */
const INFORMES_POR_ESPECIALIDAD: Record<number, { diagnostico: string; indicaciones: string; medicos: string[] }[]> = {
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

/** Informe de la atención cerrada; el mismo ID de cita siempre entrega el mismo informe. */
export function informeMedico(a: Appointment): InformeMedico {
  const opciones = INFORMES_POR_ESPECIALIDAD[a.servicioId] || INFORMES_POR_ESPECIALIDAD[1];
  const opcion = opciones[a.id % opciones.length];
  return { diagnostico: opcion.diagnostico, indicaciones: opcion.indicaciones, medico: opcion.medicos[a.id % opcion.medicos.length] };
}
