import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthTokenService } from '../services/auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private authTokenService: AuthTokenService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Validar expiración del token al intentar acceder a rutas protegidas
    if (this.authTokenService.isTokenExpired()) {
      this.authService.logout();
      return false;
    }

    // Verificar autenticación (usuario + token válido)
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
