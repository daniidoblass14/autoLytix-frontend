import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false,
})
export class ForgotPasswordPage implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading: boolean = false;
  emailSent: boolean = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio']);
    }
  }

  async onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched();
      
      if (this.emailControl?.hasError('required')) {
        this.showErrorToast('El correo electrónico es requerido');
      } else if (this.emailControl?.hasError('email')) {
        this.showErrorToast('El correo electrónico no es válido');
      }
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Enviando enlace...',
      spinner: 'crescent'
    });
    await loading.present();

    const { email } = this.forgotPasswordForm.value;

    this.authService.forgotPassword(email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        loading.dismiss();
        this.isLoading = false;
        this.emailSent = true;
        // Siempre mostrar el mismo mensaje para no revelar si el email existe
        this.showSuccessToast('Si el email existe, te hemos enviado un enlace');
      },
      error: (error) => {
        loading.dismiss();
        this.isLoading = false;
        this.emailSent = true;
        // Siempre mostrar el mismo mensaje para no revelar si el email existe
        this.showSuccessToast('Si el email existe, te hemos enviado un enlace');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched() {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
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

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'top',
      color: 'success',
      cssClass: 'success-toast'
    });
    await toast.present();
  }

  get emailControl() {
    return this.forgotPasswordForm.get('email');
  }
}
