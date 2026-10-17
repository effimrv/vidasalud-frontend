/** Configuración compartida de autenticación (Microsoft Entra ID) y del API Gateway que expone el BFF. */
export const clientId = '2c70c5bc-6b56-4564-bca4-ec0821f3cefa';
export const tenantId = '49cd374a-62d5-4d3d-851e-69058d58e3b5';
export const apiScope = 'api://2c70c5bc-6b56-4564-bca4-ec0821f3cefa/access_as_user';
export const bffUrl = 'https://dzv5td4m80.execute-api.us-east-1.amazonaws.com';

/** Scopes que se piden al iniciar sesión, para obtener de una vez el ID token y el access token del BFF. */
export const loginRequest = { scopes: [apiScope] };
