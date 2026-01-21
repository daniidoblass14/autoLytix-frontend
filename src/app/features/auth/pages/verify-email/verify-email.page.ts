import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-verify-email',
  templateUrl: 'verify-email.page.html',
  styleUrls: ['verify-email.page.scss'],
  standalone: false,
})
export class VerifyEmailPage implements OnInit {
  token: string | null = null;
  email: string | null = null;
  state: 'loading' | 'success' | 'error' | 'no-token' = 'loading';
  errorMessage: string = '';
  resendDisabled: boolean = false;
  resendCountdown: number = 0;
  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Leer query params
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      this.token = params['token'] || null;
      this.email = params['email'] || null;

      if (!this.token) {
        // Si no existe token, mostrar error
        this.state = 'no-token';
        this.errorMessage = 'Token de verificación no proporcionado.';
      } else {
        // Si existe token, verificar email
        this.verifyEmail(this.token);
      }
    });
  }

  async verifyEmail(token: string) {
    this.state = 'loading';
    const loading = await this.loadingController.create({
      message: 'Verificando email...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.verifyEmail(token).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        loading.dismiss();
        this.state = 'success';
        this.showSuccessToast('Email verificado correctamente');
      },
      error: (error) => {
        loading.dismiss();
        this.state = 'error';
        
        // Manejar diferentes códigos de error
        const status = error?.status;
        if (status === 400) {
          this.errorMessage = 'Token inválido o expirado.';
        } else if (status === 500) {
          this.errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
        } else {
          this.errorMessage = error?.error?.message || error?.message || 'Error al verificar el email.';
        }
      }
    });
  }

  async resendVerification() {
    if (!this.email) {
      this.showErrorToast('Por favor, introduce un email válido');
      return;
    }

    // Validar email antes de enviar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showErrorToast('Por favor, introduce un email válido');
      return;
    }

    if (this.resendDisabled) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Enviando correo...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.resendVerification(this.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        loading.dismiss();
        // Mostrar mensaje genérico para evitar enumeración
        this.showSuccessToast('Si el correo existe, te enviaremos un enlace de verificación');
        this.startResendCooldown();
      },
      error: (error) => {
        loading.dismiss();
        // Mostrar mensaje genérico incluso en error para evitar enumeración
        this.showSuccessToast('Si el correo existe, te enviaremos un enlace de verificación');
        this.startResendCooldown();
      }
    });
  }

  startResendCooldown() {
    this.resendDisabled = true;
    this.resendCountdown = 15;

    const interval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(interval);
        this.resendDisabled = false;
      }
    }, 1000);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'success',
      cssClass: 'success-toast'
    });
    await toast.present();
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
}
