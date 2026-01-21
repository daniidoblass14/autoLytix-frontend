export interface LoginResponseDTO {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  mensaje: string;
  token?: string; // JWT token opcional (puede venir en el header o en el body según el backend)
}

export interface UsuarioLoginRequestDTO {
  email: string;
  password: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  creadoEn?: string; // Opcional, viene del backend al actualizar
}

export interface PasswordUpdateRequestDTO {
  passwordActual: string;
  passwordNueva: string;
}

export interface ProfileUpdateRequestDTO {
  nombre: string;
  apellido: string;
  telefono?: string;
}

export interface UsuarioRegisterRequestDTO {
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  password: string;
}

/**
 * Respuesta genérica de la API con mensaje
 */
export interface ApiMessageResponse {
  mensaje: string;
  [key: string]: any; // Permite campos adicionales según el endpoint
}
