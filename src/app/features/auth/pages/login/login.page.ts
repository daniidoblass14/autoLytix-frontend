import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit, AfterViewInit {
  loginForm: FormGroup;
  passwordVisible: boolean = false;
  isLoading: boolean = false;
  private googleButtonInitialized: boolean = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit() {
    // Si ya está autenticado, redirigir a vehicles
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/vehicles']);
    }
  }

  ngAfterViewInit() {
    // Inicializar el botón de Google cuando el DOM esté listo
    if (!Capacitor.isNativePlatform()) {
      this.initGoogleButton();
    }
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      
      // Mostrar mensajes de error específicos
      if (this.emailControl?.hasError('required')) {
        this.showErrorToast('El correo electrónico es requerido');
      } else if (this.emailControl?.hasError('email')) {
        this.showErrorToast('El correo electrónico no es válido');
      } else if (this.passwordControl?.hasError('required')) {
        this.showErrorToast('La contraseña es requerida');
      } else if (this.passwordControl?.hasError('minlength')) {
        this.showErrorToast('La contraseña debe tener al menos 4 caracteres');
      }
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.authService.saveUser(response);
        loading.dismiss();
        this.isLoading = false;
        this.router.navigate(['/inicio']);
      },
      error: (error) => {
        loading.dismiss();
        this.isLoading = false;
        
        // Verificar si el error es EMAIL_NOT_VERIFIED
        if (error?.status === 403 && error?.error?.code === 'EMAIL_NOT_VERIFIED') {
          const errorMessage = error?.error?.message || 'Tu email no ha sido verificado.';
          this.showErrorToast(errorMessage);
          // Redirigir a verificación con el email
          setTimeout(() => {
            this.router.navigate(['/verify-email'], { queryParams: { email: email } });
          }, 1500);
        } else {
          const errorMessage = error?.error?.mensaje || error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
          this.showErrorToast(errorMessage);
        }
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'danger',
      cssClass: 'error-toast'
    });
    await toast.present();
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  /**
   * Inicializa el botón oficial de Google usando renderButton()
   * Evita el uso de prompt() que causa errores FedCM en localhost
   */
  private async initGoogleButton(retryCount: number = 0): Promise<void> {
    const maxRetries = 3;
    const retryDelay = 300;

    // Verificar que el script de Google esté cargado
    if (typeof (window as any).google === 'undefined' || !(window as any).google?.accounts?.id) {
      if (retryCount < maxRetries) {
        setTimeout(() => {
          this.initGoogleButton(retryCount + 1);
        }, retryDelay);
        return;
      } else {
        this.showErrorToast('Google Identity Services no está disponible. Por favor, recarga la página.');
        return;
      }
    }

    const google = (window as any).google;
    const clientId = environment.googleClientIdWeb;

    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_WEB_HERE') {
      this.showErrorToast('Google Client ID no configurado. Contacta al administrador.');
      return;
    }

    // Verificar que el elemento del DOM existe
    const googleBtnElement = document.getElementById('googleBtn');
    if (!googleBtnElement) {
      return;
    }

    // Opcional: Verificar si Google login está habilitado (por si se añade flag en environment)
    // Por ahora, siempre intentamos inicializar si el elemento existe

    // Evitar inicialización múltiple
    if (this.googleButtonInitialized) {
      return;
    }

    try {
      // Inicializar Google Identity Services con callback
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const idToken = response?.credential;
            
            if (!idToken) {
              this.showErrorToast('Error: No se recibió el token de Google');
              return;
            }

            // Crear loading
            const loading = await this.loadingController.create({
              message: 'Iniciando sesión con Google...',
              spinner: 'crescent'
            });
            await loading.present();

            // Procesar el login
            await this.processGoogleLogin(idToken, loading);
          } catch (error: any) {
            // Manejar errores de OAuth (origin_mismatch, etc.)
            if (error?.error === 'popup_closed_by_user' || error?.type === 'popup_closed') {
              // Usuario cerró la ventana, no mostrar error
              return;
            }
            this.showErrorToast('Error al procesar la respuesta de Google');
          }
        },
        error_callback: (error: any) => {
          // Manejar errores de inicialización de Google OAuth
          if (error?.type === 'popup_failed' || error?.type === 'popup_blocked') {
            this.showErrorToast('No se pudo abrir la ventana de Google. Verifica que los popups no estén bloqueados.');
          } else if (error?.error === 'origin_mismatch' || error?.error === 'idpiframe_initialization_failed') {
            const currentOrigin = window.location.origin;
            this.showErrorToast(
              `Google Login no configurado para este origen (${currentOrigin}). ` +
              `Añade ${currentOrigin} en Google Cloud Console > OAuth Client > Authorized JavaScript origins.`
            );
          } else {
            this.showErrorToast('Error al inicializar Google Login. Verifica la configuración.');
          }
        }
      });

      // Renderizar el botón oficial de Google
      google.accounts.id.renderButton(googleBtnElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 320
      });

      this.googleButtonInitialized = true;

    } catch (error) {
      this.showErrorToast('Error al inicializar el botón de Google. Intenta recargar la página.');
    }
  }

  /**
   * Login con Google para móvil usando Capacitor (stub - pendiente de implementar)
   */
  private async loginWithGoogleMobile(): Promise<void> {
    // TODO: Implementar con plugin de Capacitor para Google Sign In
    // Por ahora, mostrar mensaje
    this.showErrorToast('Login con Google en móvil estará disponible próximamente');
  }

  /**
   * Método común para procesar el login con Google después de obtener el idToken
   * @param idToken - El JWT token de Google
   * @param loading - El loading controller instance (opcional)
   */
  private async processGoogleLogin(idToken: string, loading?: HTMLIonLoadingElement): Promise<void> {
    this.authService.loginWithGoogle(idToken).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.authService.saveUser(response);
        if (loading) {
          loading.dismiss();
        }
        this.isLoading = false;
        this.router.navigate(['/inicio']);
      },
      error: (error) => {
        if (loading) {
          loading.dismiss();
        }
        this.isLoading = false;
        
        // Verificar si el error es EMAIL_NOT_VERIFIED (aunque es raro con Google)
        if (error?.status === 403 && error?.error?.code === 'EMAIL_NOT_VERIFIED') {
          const errorMessage = error?.error?.message || 'Tu email no ha sido verificado.';
          this.showErrorToast(errorMessage);
          // Redirigir a verificación con el email si está disponible
          const email = error?.error?.email || '';
          if (email) {
            setTimeout(() => {
              this.router.navigate(['/verify-email'], { queryParams: { email: email } });
            }, 1500);
          }
        } else {
          const errorMessage = error?.error?.mensaje || error?.message || 'No se pudo iniciar sesión con Google. Intenta nuevamente.';
          this.showErrorToast(errorMessage);
        }
      }
    });
  }

  onFacebookLogin() {
    // Placeholder - sin lógica por ahora
  }

  onAppleLogin() {
    // Placeholder - sin lógica por ahora
  }

  onRegister() {
    this.router.navigate(['/register']);
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }
}
