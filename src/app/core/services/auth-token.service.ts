import { Injectable } from '@angular/core';

/**
 * Servicio centralizado para la gestión del token JWT
 * 
 * Responsabilidades:
 * - Almacenar y recuperar el token del localStorage
 * - Validar la expiración del token JWT
 * - Limpiar el token cuando sea necesario
 */
@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {
  // Constantes públicas para unificar claves de almacenamiento
  public static readonly TOKEN_KEY = 'autolytix_token';
  public static readonly USER_KEY = 'autolytix_user';

  /**
   * Obtiene el token JWT almacenado
   * @returns El token JWT o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem(AuthTokenService.TOKEN_KEY);
  }

  /**
   * Guarda el token JWT en localStorage
   * @param token El token JWT a guardar
   */
  setToken(token: string): void {
    if (!token || token.trim() === '') {
      return;
    }
    localStorage.setItem(AuthTokenService.TOKEN_KEY, token);
  }

  /**
   * Elimina el token JWT del localStorage
   */
  clearToken(): void {
    localStorage.removeItem(AuthTokenService.TOKEN_KEY);
  }

  /**
   * Verifica si el token JWT está expirado
   * 
   * Un token JWT tiene la estructura: header.payload.signature
   * El payload contiene el campo 'exp' (expiration) en formato Unix timestamp
   * 
   * @returns true si el token está expirado o no existe, false si es válido
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    
    if (!token) {
      return true; // No hay token = expirado
    }

    try {
      // Decodificar el payload del JWT (segunda parte, separada por puntos)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true; // Formato inválido = expirado
      }

      // Decodificar el payload (base64url)
      const payload = parts[1];
      const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

      // Verificar si tiene el campo 'exp'
      if (!decodedPayload.exp) {
        return true; // Sin expiración definida = considerar expirado por seguridad
      }

      // 'exp' está en segundos Unix timestamp, Date.now() está en milisegundos
      const expirationTime = decodedPayload.exp * 1000;
      const currentTime = Date.now();

      // Añadir un margen de seguridad de 5 segundos para evitar problemas de timing
      const margin = 5000; // 5 segundos
      const isExpired = currentTime >= (expirationTime - margin);

      return isExpired;

    } catch (error) {
      return true; // Error al decodificar = considerar expirado por seguridad
    }
  }

  /**
   * Verifica si existe un token válido (existe y no está expirado)
   * @returns true si el token existe y no está expirado
   */
  hasValidToken(): boolean {
    return !this.isTokenExpired();
  }
}
