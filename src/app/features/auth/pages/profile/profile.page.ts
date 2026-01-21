import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../../../core/services/auth.service';
import { Usuario, ProfileUpdateRequestDTO } from '../../../../core/models/login-response.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  currentUser: Usuario | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  preferencesForm: FormGroup;
  
  isEditing = false;
  isSaving = false;
  isUpdatingPassword = false;
  
  // Preferencias
  emailNotifications = true;
  maintenanceAlerts = true;
  itvReminders = true;

  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.profileForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
      telefono: ['', [Validators.pattern(/^[0-9]{9,15}$/)]]
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.preferencesForm = this.formBuilder.group({
      emailNotifications: [true],
      maintenanceAlerts: [true],
      itvReminders: [true]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.currentUser = this.authService.getUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Cargar datos del usuario
    const userData = {
      nombre: this.currentUser.nombre || '',
      apellido: this.currentUser.apellido || '',
      email: this.currentUser.email || '',
      telefono: this.currentUser.telefono || ''
    };

    this.profileForm.patchValue(userData);
    this.profileForm.markAsPristine(); // Marcar como no modificado
  }

  getInitials(): string {
    if (!this.currentUser) return 'U';
    const nombre = this.currentUser.nombre || '';
    const apellido = this.currentUser.apellido || '';
    
    if (nombre && apellido) {
      return (nombre[0] + apellido[0]).toUpperCase();
    } else if (nombre) {
      return nombre[0].toUpperCase();
    }
    return 'U';
  }

  getFullName(): string {
    if (!this.currentUser) return 'Usuario';
    const nombre = this.currentUser.nombre || '';
    const apellido = this.currentUser.apellido || '';
    return `${nombre} ${apellido}`.trim() || 'Usuario';
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadUserProfile(); // Resetear formulario
    } else {
      // Al entrar en modo edición, marcar el formulario como touched para que se detecten cambios
      this.profileForm.markAsTouched();
    }
  }

  async onSaveProfile() {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      
      if (this.profileForm.get('nombre')?.hasError('required')) {
        await this.showToast('El nombre es requerido', 'warning');
      } else if (this.profileForm.get('apellido')?.hasError('required')) {
        await this.showToast('El apellido es requerido', 'warning');
      } else if (this.profileForm.get('telefono')?.hasError('pattern')) {
        await this.showToast('El teléfono debe tener entre 9 y 15 dígitos', 'warning');
      } else {
        await this.showToast('Por favor, completa todos los campos requeridos', 'warning');
      }
      return;
    }

    if (!this.isFormDirty) {
      await this.showToast('No hay cambios para guardar', 'warning');
      return;
    }

    this.isSaving = true;
    const loading = await this.loadingController.create({
      message: 'Guardando cambios...',
      spinner: 'crescent'
    });
    await loading.present();

    // Usar getRawValue() para obtener todos los valores incluyendo campos deshabilitados
    const formValue = this.profileForm.getRawValue();
    
    // Preparar datos para el endpoint
    const profileData: ProfileUpdateRequestDTO = {
      nombre: formValue.nombre.trim(),
      apellido: formValue.apellido.trim(),
      telefono: formValue.telefono?.trim() || undefined
    };

    // Llamar al endpoint real PUT /api/usuarios/me
    this.authService.updateProfile(profileData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        // Actualizar usuario en AuthService (localStorage + BehaviorSubject)
        this.authService.setUser(response);
        this.currentUser = response;
        this.isEditing = false;
        this.isSaving = false;
        loading.dismiss();
        this.showToast('Perfil actualizado correctamente', 'success');
        
        // Recargar el formulario con los nuevos datos
        this.loadUserProfile();
      },
      error: (error) => {
        this.isSaving = false;
        loading.dismiss();
        
        let errorMessage = 'No se pudo actualizar el perfil';
        if (error?.error?.mensaje) {
          errorMessage = error.error.mensaje;
        } else if (error?.status === 400) {
          errorMessage = 'Datos inválidos. Verifica los campos e intenta nuevamente';
        } else if (error?.status === 401 || error?.status === 403) {
          errorMessage = 'No tienes permisos para actualizar el perfil';
        } else if (error?.status === 404) {
          errorMessage = 'Usuario no encontrado';
        }
        
        this.showToast(errorMessage, 'danger');
      }
    });
  }

  async onUpdatePassword() {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      
      if (this.passwordForm.get('currentPassword')?.hasError('required')) {
        await this.showToast('La contraseña actual es requerida', 'warning');
      } else if (this.passwordForm.get('newPassword')?.hasError('required')) {
        await this.showToast('La nueva contraseña es requerida', 'warning');
      } else if (this.passwordForm.get('newPassword')?.hasError('minlength')) {
        await this.showToast('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
      } else if (this.passwordForm.hasError('passwordMismatch')) {
        await this.showToast('Las contraseñas no coinciden', 'danger');
      } else {
        await this.showToast('Por favor, completa todos los campos correctamente', 'warning');
      }
      return;
    }

    this.isUpdatingPassword = true;
    const loading = await this.loadingController.create({
      message: 'Actualizando contraseña...',
      spinner: 'crescent'
    });
    await loading.present();

    const passwordData = {
      passwordActual: this.passwordForm.value.currentPassword,
      passwordNueva: this.passwordForm.value.newPassword
    };

    this.authService.updatePassword(passwordData).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isUpdatingPassword = false;
        loading.dismiss();
        this.passwordForm.reset();
        this.showToast('Contraseña actualizada correctamente', 'success');
      },
      error: (error) => {
        this.isUpdatingPassword = false;
        loading.dismiss();
        
        let errorMessage = 'No se pudo actualizar la contraseña';
        if (error?.error?.mensaje) {
          errorMessage = error.error.mensaje;
        } else if (error?.status === 401 || error?.status === 403) {
          errorMessage = 'La contraseña actual es incorrecta';
        } else if (error?.status === 400) {
          errorMessage = error?.error?.mensaje || 'Datos inválidos';
        }
        
        this.showToast(errorMessage, 'danger');
      }
    });
  }

  onPreferenceChange(preference: string, value: boolean) {
    this.preferencesForm.patchValue({ [preference]: value });
    // Aquí se podría guardar automáticamente o con un botón "Guardar preferencias"
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (!newPassword || !confirmPassword) {
      return null;
    }
    
    return newPassword.value === confirmPassword.value 
      ? null 
      : { passwordMismatch: true };
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  get isFormDirty(): boolean {
    // Verificar si hay cambios comparando valores actuales con los originales
    if (!this.currentUser || !this.isEditing) return false;
    
    // Usar getRawValue() para obtener todos los valores incluyendo campos deshabilitados
    const formValue = this.profileForm.getRawValue();
    const nombreChanged = (formValue.nombre?.trim() || '') !== (this.currentUser.nombre || '');
    const apellidoChanged = (formValue.apellido?.trim() || '') !== (this.currentUser.apellido || '');
    const telefonoChanged = (formValue.telefono?.trim() || '') !== (this.currentUser.telefono || '');
    
    return nombreChanged || apellidoChanged || telefonoChanged;
  }

  get passwordMismatch(): boolean {
    const confirmPasswordControl = this.passwordForm.get('confirmPassword');
    return this.passwordForm.hasError('passwordMismatch') && 
           (confirmPasswordControl?.touched ?? false);
  }

  /**
   * Cierra la sesión del usuario
   */
  onLogout() {
    this.authService.logout();
  }
}
