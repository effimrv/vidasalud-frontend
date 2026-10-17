import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduce un error HTTP a un mensaje claro para el usuario.
 * @param accion lo que se intentaba hacer, en infinitivo (ej: "cargar tus atenciones").
 */
export function describirErrorHttp(err: unknown, accion: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return `No se pudo ${accion}. Inténtalo nuevamente.`;
  }
  switch (err.status) {
    case 0:
      return `No se pudo ${accion}: no hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.`;
    case 400:
      return `No se pudo ${accion}: algunos datos no son válidos. Revísalos e inténtalo nuevamente.`;
    case 401:
      return 'Tu sesión expiró. Cierra sesión y vuelve a ingresar para continuar.';
    case 403:
      return `Tu cuenta no tiene permisos para ${accion}. Si eres parte del equipo del centro, pide a un administrador que te asigne el rol correspondiente.`;
    case 404:
      return `No se pudo ${accion}: el registro ya no existe. Actualiza la página.`;
    default:
      return err.status >= 500
        ? `El servicio no está disponible en este momento y no se pudo ${accion}. Inténtalo en unos minutos.`
        : `No se pudo ${accion}. Inténtalo nuevamente.`;
  }
}

/** Mensaje para un inicio de sesión o registro que no terminó bien en Microsoft Entra ID. */
export function describirErrorLogin(err: unknown): string {
  const texto = err instanceof Error ? `${(err as { errorCode?: string }).errorCode ?? ''} ${err.message}` : String(err);

  if (/user_cancelled|access_denied|AADSTS65004/i.test(texto)) {
    return 'Cancelaste el inicio de sesión o el registro. Puedes intentarlo nuevamente cuando quieras.';
  }
  if (/AADSTS50020|AADSTS50034|AADSTS90072/i.test(texto)) {
    return 'Tu cuenta todavía no está registrada en VidaSalud. Usa "Crear cuenta" para registrarte con tu correo.';
  }
  if (/AADSTS50011/i.test(texto)) {
    return 'Esta dirección del sitio no está autorizada para iniciar sesión. Avisa al administrador del centro.';
  }
  return 'No pudimos completar el inicio de sesión. Inténtalo nuevamente en unos segundos.';
}
