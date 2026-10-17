import { HttpErrorResponse } from '@angular/common/http';
import { describirErrorHttp, describirErrorLogin } from './mensajes-error';

describe('mensajes-error', () => {
  const error = (status: number) => new HttpErrorResponse({ status });

  it('explica la causa de cada error HTTP', () => {
    expect(describirErrorHttp(error(0), 'cargar tus atenciones')).toContain('no hay conexión');
    expect(describirErrorHttp(error(401), 'x')).toContain('sesión expiró');
    expect(describirErrorHttp(error(403), 'guardar la especialidad')).toContain('no tiene permisos para guardar la especialidad');
    expect(describirErrorHttp(error(503), 'x')).toContain('no está disponible');
  });

  it('reconoce un login cancelado o una cuenta no registrada', () => {
    expect(describirErrorLogin(new Error('user_cancelled: el usuario canceló'))).toContain('Cancelaste');
    expect(describirErrorLogin(new Error('AADSTS50020: usuario no existe'))).toContain('Crear cuenta');
  });
});
