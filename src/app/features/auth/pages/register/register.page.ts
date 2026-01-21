import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioRegisterRequestDTO } from '../../../../core/models/login-response.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  isLoading: boolean = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.registerForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      apellido: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Si ya está autenticado, redirigir a inicio
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio']);
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      
      // Mostrar mensajes de error específicos
      if (this.nombreControl?.hasError('required')) {
        this.showErrorToast('El nombre es requerido');
      } else if (this.emailControl?.hasError('required')) {
        this.showErrorToast('El correo electrónico es requerido');
      } else if (this.emailControl?.hasError('email')) {
        this.showErrorToast('El correo electrónico no es válido');
      } else if (this.passwordControl?.hasError('required')) {
        this.showErrorToast('La contraseña es requerida');
      } else if (this.passwordControl?.hasError('minlength')) {
        this.showErrorToast('La contraseña debe tener al menos 6 caracteres');
      } else if (this.confirmPasswordControl?.hasError('required')) {
        this.showErrorToast('Debes confirmar tu contraseña');
      } else if (this.registerForm.hasError('passwordMismatch')) {
        this.showErrorToast('Las contraseñas no coinciden');
      }
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Creando cuenta...',
      spinner: 'crescent'
    });
    await loading.present();

    const { nombre, apellido, email, telefono, password } = this.registerForm.value;

    // Preparar datos: omitir campos opcionales vacíos
    const registerData: UsuarioRegisterRequestDTO = {
      nombre,
      email,
      password
    };
    
    if (apellido && apellido.trim()) {
      registerData.apellido = apellido.trim();
    }
    
    if (telefono && telefono.trim()) {
      registerData.telefono = telefono.trim();
    }

    this.authService.register(registerData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        loading.dismiss();
        this.isLoading = false;
        this.showSuccessToast('Cuenta creada exitosamente');
        // Redirigir a verificación de email
        setTimeout(() => {
          this.router.navigate(['/verify-email'], { queryParams: { email: email } });
        }, 1000);
      },
      error: (error) => {
        loading.dismiss();
        this.isLoading = false;
        const errorMessage = error?.error?.mensaje || error?.message || 'Error al crear la cuenta. Intenta nuevamente.';
        this.showErrorToast(errorMessage);
      }
    });
  }

  onBackToLogin() {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
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
      duration: 2000,
      position: 'top',
      color: 'success',
      cssClass: 'success-toast'
    });
    await toast.present();
  }

  get nombreControl() {
    return this.registerForm.get('nombre');
  }

  get apellidoControl() {
    return this.registerForm.get('apellido');
  }

  get emailControl() {
    return this.registerForm.get('email');
  }

  get telefonoControl() {
    return this.registerForm.get('telefono');
  }

  get passwordControl() {
    return this.registerForm.get('password');
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword');
  }
}
