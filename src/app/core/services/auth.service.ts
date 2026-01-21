import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginResponseDTO, UsuarioLoginRequestDTO, Usuario, PasswordUpdateRequestDTO, ProfileUpdateRequestDTO, UsuarioRegisterRequestDTO, ApiMessageResponse } from '../models/login-response.dto';
import { AuthTokenService } from './auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/api/usuarios`;
  private userSubject = new BehaviorSubject<Usuario | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private authTokenService: AuthTokenService
  ) {
    // Cargar usuario inicial desde localStorage
    const savedUser = this.getUserFromStorage();
    if (savedUser) {
      // Validar token al iniciar la app
      if (this.authTokenService.isTokenExpired()) {
        this.logout();
      } else {
        this.userSubject.next(savedUser);
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponseDTO> {
    const body: UsuarioLoginRequestDTO = { email, password };
    return this.http.post<LoginResponseDTO>(`${this.API_URL}/login`, body, { observe: 'response' }).pipe(
      tap((response: HttpResponse<LoginResponseDTO>) => {
        // El token puede venir en el body o en el header Authorization
        const tokenFromBody = response.body?.token;
        const tokenFromHeader = response.headers.get('Authorization')?.replace('Bearer ', '');
        
        const token = tokenFromBody || tokenFromHeader;
        if (token) {
          this.authTokenService.setToken(token);
        }
      }),
      map((response: HttpResponse<LoginResponseDTO>) => response.body!)
    );
  }

  register(data: UsuarioRegisterRequestDTO): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(`${this.API_URL}/register`, data, { observe: 'response' }).pipe(
      tap((response: HttpResponse<LoginResponseDTO>) => {
        // El token puede venir en el body o en el header Authorization
        const tokenFromBody = response.body?.token;
        const tokenFromHeader = response.headers.get('Authorization')?.replace('Bearer ', '');
        
        const token = tokenFromBody || tokenFromHeader;
        if (token) {
          this.authTokenService.setToken(token);
        }
      }),
      map((response: HttpResponse<LoginResponseDTO>) => response.body!)
    );
  }

  loginWithGoogle(idToken: string): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(`${this.API_URL}/oauth/google`, { idToken }, { observe: 'response' }).pipe(
      tap((response: HttpResponse<LoginResponseDTO>) => {
        // El token puede venir en el body o en el header Authorization
        const tokenFromBody = response.body?.token;
        const tokenFromHeader = response.headers.get('Authorization')?.replace('Bearer ', '');
        
        const token = tokenFromBody || tokenFromHeader;
        if (token) {
          this.authTokenService.setToken(token);
        }
      }),
      map((response: HttpResponse<LoginResponseDTO>) => response.body!)
    );
  }

  saveUser(user: LoginResponseDTO): void {
    const usuario: Usuario = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido || '',
      email: user.email,
      telefono: user.telefono
    };
    this.setUser(usuario);
  }

  setUser(user: Usuario): void {
    localStorage.setItem(AuthTokenService.USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  getUser(): Usuario | null {
    return this.userSubject.value || this.getUserFromStorage();
  }

  private getUserFromStorage(): Usuario | null {
    const userStr = localStorage.getItem(AuthTokenService.USER_KEY);
    if (!userStr) {
      return null;
    }
    try {
      const user = JSON.parse(userStr);
      // Si el usuario guardado no tiene apellido, añadirlo vacío para compatibilidad
      if (!user.apellido) {
        user.apellido = '';
      }
      return user;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const user = this.getUser();
    const hasValidToken = this.authTokenService.hasValidToken();
    
    // Para estar autenticado, debe haber usuario Y token válido
    return user !== null && hasValidToken;
  }

  /**
   * Cierra la sesión del usuario:
   * - Elimina todos los datos del localStorage (usuario y token)
   * - Limpia el estado de autenticación
   * - Redirige al login
   */
  logout(): void {
    // Eliminar datos del usuario
    localStorage.removeItem(AuthTokenService.USER_KEY);
    
    // Eliminar token JWT usando el servicio centralizado
    this.authTokenService.clearToken();
    
    // Limpiar estado de autenticación
    this.userSubject.next(null);
    
    // Redirigir al login
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  getUserId(): number | null {
    const user = this.getUser();
    return user ? user.id : null;
  }

  // Cambiar contraseña (endpoint real)
  updatePassword(passwordData: PasswordUpdateRequestDTO): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(`${this.API_URL}/me/password`, passwordData);
  }

  // Actualizar perfil (endpoint real)
  updateProfile(profileData: ProfileUpdateRequestDTO): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.API_URL}/me`, profileData);
  }

  // Verificar email
  verifyEmail(token: string): Observable<ApiMessageResponse> {
    return this.http.get<ApiMessageResponse>(`${this.API_URL}/verify-email`, { params: { token } });
  }

  // Reenviar verificación de email
  resendVerification(email: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.API_URL}/resend-verification`, { email });
  }

  // Solicitar reset de contraseña
  forgotPassword(email: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.API_URL}/password/forgot`, { email });
  }

  // Reset de contraseña con token
  resetPassword(token: string, newPassword: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.API_URL}/password/reset`, { token, newPassword });
  }
}
