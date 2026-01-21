import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthTokenService } from '../services/auth-token.service';

/**
 * Interceptor HTTP que:
 * 1. Permite rutas públicas sin validación de token
 * 2. Añade el header Authorization: Bearer <token> cuando existe token válido en rutas protegidas
 * 3. Valida la expiración del token antes de hacer peticiones a rutas protegidas
 * 4. Maneja errores 401 (Unauthorized) globalmente
 * 
 * Cuando el backend responde con 401, significa que:
 * - El token JWT ha expirado
 * - El token es inválido
 * - El usuario no está autenticado
 * 
 * En estos casos, ejecuta logout() automáticamente para:
 * - Limpiar el estado de autenticación
 * - Eliminar datos del localStorage
 * - Redirigir al login
 * 
 * Esto evita estados inconsistentes en la aplicación.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Lista de endpoints públicos que NO requieren token
  private readonly publicEndpoints: string[] = [
    '/api/usuarios/login',
    '/api/usuarios/register',
    '/api/usuarios/oauth/google',
    '/api/usuarios/verify-email',
    '/api/usuarios/resend-verification',
    '/api/usuarios/password/forgot',
    '/api/usuarios/password/reset',
    '/api/health'
  ];

  constructor(
    private authService: AuthService,
    private authTokenService: AuthTokenService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Verificar si la petición es a un endpoint público
    const isPublicEndpoint = this.publicEndpoints.some(endpoint => request.url.includes(endpoint));

    // Si es un endpoint público, pasar la petición sin validación ni header
    if (isPublicEndpoint) {
      return next.handle(request).pipe(
        catchError((error: HttpErrorResponse) => {
          // Para endpoints públicos, no hacer logout en 401 (es normal que falle el login)
          // Re-lanzar el error para que los componentes puedan manejarlo
          return throwError(() => error);
        })
      );
    }

    // Para rutas protegidas: validar token
    const token = this.authTokenService.getToken();

    // Si hay token, validar expiración
    if (token) {
      if (this.authTokenService.isTokenExpired()) {
        this.authService.logout();
        return throwError(() => new Error('Token expirado'));
      }

      // Token válido: añadir header Authorization
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      // Procesar la petición con token y manejar errores
      return next.handle(authRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          // Detectar errores 401 (Unauthorized)
          if (error.status === 401) {
            // Ejecutar logout para limpiar estado y redirigir
            this.authService.logout();
          }

          // Re-lanzar el error para que los componentes puedan manejarlo si es necesario
          return throwError(() => error);
        })
      );
    }

    // Si no hay token en ruta protegida, dejar pasar sin header
    // El backend devolverá 401 si es protegido, y el catchError lo manejará
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Detectar errores 401 (Unauthorized)
        if (error.status === 401) {
          // Ejecutar logout para limpiar estado y redirigir
          this.authService.logout();
        }

        // Re-lanzar el error para que los componentes puedan manejarlo si es necesario
        return throwError(() => error);
      })
    );
  }
}
