import { estadoLegible, formatearPrecio, haceCuanto, indicePaso, PASOS_CITA } from './formato';

describe('formato', () => {
  it('traduce los estados de la cita a texto para el paciente', () => {
    expect(estadoLegible('SOLICITADA')).toBe('Solicitud en Revisión');
    expect(estadoLegible('CERRADA')).toBe('Atención Finalizada');
    expect(estadoLegible('OTRO')).toBe('OTRO');
  });

  it('ubica cada estado en la barra de progreso y deja fuera la cancelación', () => {
    expect(PASOS_CITA.length).toBe(5);
    expect(indicePaso('SOLICITADA')).toBe(0);
    expect(indicePaso('EN_ATENCION')).toBe(3);
    expect(indicePaso('CANCELADA')).toBe(-1);
  });

  it('formatea precios en pesos chilenos', () => {
    expect(formatearPrecio(15000)).toContain('15.000');
    expect(formatearPrecio(undefined)).toBe('$0');
  });

  it('describe cuánto tiempo pasó desde un cambio', () => {
    const ahora = Date.parse('2026-10-19T15:00:00Z');
    expect(haceCuanto('2026-10-19T14:59:48Z', ahora)).toBe('hace 12 s');
    expect(haceCuanto('2026-10-19T14:57:00Z', ahora)).toBe('hace 3 min');
    expect(haceCuanto(undefined, ahora)).toBe('');
  });
});
