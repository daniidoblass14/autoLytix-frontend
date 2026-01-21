import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { MAINTENANCE_TYPES } from '../../../../core/constants/maintenance-types';
import { MantenimientoResponseDTO } from '../../../../core/models/mantenimiento-response.dto';
import { MantenimientoRequestDTO } from '../../../../core/models/mantenimiento-request.dto';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-maintenance-modal',
  templateUrl: './edit-maintenance-modal.component.html',
  styleUrls: ['./edit-maintenance-modal.component.scss'],
  standalone: false,
})
export class EditMaintenanceModalComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() vehicleId: number | null = null;
  @Input() maintenance: MantenimientoResponseDTO | null = null;
  @Input() currentVehicleKm: number | null = null; // Kilometraje actual del vehículo para validación

  maintenanceForm!: FormGroup;
  isSaving: boolean = false;
  errorMessage: string | null = null;

  tiposMantenimiento = MAINTENANCE_TYPES;

  constructor(
    private modalController: ModalController,
    private maintenanceService: MaintenanceService,
    private toastController: ToastController,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.maintenanceForm = this.fb.group({
      tipo: ['', [Validators.required]],
      fecha: ['', [Validators.required]],
      km: [null, [Validators.required, Validators.min(0), Validators.max(5000000)]],
      precio: [null, [Validators.required, Validators.min(0), Validators.max(100000)]],
      notas: [''],
      proximoKm: [null, [Validators.min(0), Validators.max(5000000)]],
      proximaFecha: ['']
    });
  }

  /**
   * Convierte una fecha a formato YYYY-MM-DD de forma segura
   * @param dateInput Fecha como string, Date, number o null/undefined
   * @returns String en formato YYYY-MM-DD o string vacío si es inválida
   */
  private formatDateForInput(dateInput: any): string {
    if (!dateInput) return '';
    
    let date: Date | null = null;
    
    if (dateInput instanceof Date) {
      date = isNaN(dateInput.getTime()) ? null : dateInput;
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
      if (isNaN(date.getTime())) date = null;
    } else if (typeof dateInput === 'string') {
      // Si ya está en formato YYYY-MM-DD, devolverlo directamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      
      // Intentar parsear
      date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        // Intentar parsear formato YYYY-MM-DD manualmente
        const ymdMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (ymdMatch) {
          const year = parseInt(ymdMatch[1], 10);
          const month = parseInt(ymdMatch[2], 10) - 1;
          const day = parseInt(ymdMatch[3], 10);
          
          if (year >= 1900 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            date = new Date(year, month, day);
            if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
              date = null;
            }
          } else {
            date = null;
          }
        } else {
          date = null;
        }
      }
    }
    
    if (!date) return '';
    
    // Convertir a YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.maintenance) {
      // Formatear fecha para input date (YYYY-MM-DD) de forma segura
      const fecha = this.formatDateForInput(this.maintenance.fecha);
      const proximaFecha = this.formatDateForInput(this.maintenance.proximaFecha);

      this.maintenanceForm.patchValue({
        tipo: this.maintenance.tipo || '',
        fecha: fecha,
        km: this.maintenance.km || null,
        precio: this.maintenance.precio || null,
        notas: this.maintenance.notas || '',
        proximoKm: this.maintenance.proximoKm || null,
        proximaFecha: proximaFecha
      });
      
      this.cdr.detectChanges();
    } else if (this.mode === 'create') {
      // Si es crear, establecer fecha actual por defecto
      const today = new Date().toISOString().split('T')[0];
      this.maintenanceForm.patchValue({
        fecha: today
      });
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  async save() {
    if (this.maintenanceForm.invalid || !this.vehicleId) {
      Object.keys(this.maintenanceForm.controls).forEach(key => {
        this.maintenanceForm.get(key)?.markAsTouched();
      });
      
      if (!this.vehicleId) {
        const toast = await this.toastController.create({
          message: 'Error: No se pudo obtener el ID del vehículo',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    try {
      const formValue = this.maintenanceForm.value;
      
      // Convertir valores a números (asegurar que no sean strings)
      const km = Number(formValue.km);
      const precio = Number(formValue.precio);
      const proximoKm = formValue.proximoKm ? Number(formValue.proximoKm) : null;

      // Validar que km no sea mayor que el kilometraje actual del vehículo
      if (this.currentVehicleKm !== null && km > this.currentVehicleKm) {
        this.isSaving = false;
        this.errorMessage = `El kilometraje del mantenimiento (${km.toLocaleString('es-ES')} km) no puede ser mayor que el kilometraje actual del vehículo (${this.currentVehicleKm.toLocaleString('es-ES')} km). Por favor, actualiza primero el kilometraje del vehículo.`;
        const toast = await this.toastController.create({
          message: this.errorMessage,
          duration: 5000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
        return;
      }

      // Validar rangos
      if (km < 0 || km > 5000000) {
        this.isSaving = false;
        this.errorMessage = 'El kilometraje debe estar entre 0 y 5.000.000 km';
        return;
      }

      if (precio < 0 || precio > 100000) {
        this.isSaving = false;
        this.errorMessage = 'El precio debe estar entre 0 y 100.000 €';
        return;
      }

      // Preparar el body según el endpoint
      const mantenimientoData: MantenimientoRequestDTO = {
        vehiculoId: this.vehicleId,
        tipo: formValue.tipo,
        fecha: formValue.fecha, // Ya viene en formato YYYY-MM-DD del input date
        km: km, // Asegurar que es número
        precio: precio, // Asegurar que es número
        notas: formValue.notas?.trim() || null,
        proximoKm: proximoKm,
        proximaFecha: formValue.proximaFecha || null
      };

      let result: MantenimientoResponseDTO;

      if (this.mode === 'create') {
        result = await firstValueFrom(this.maintenanceService.create(mantenimientoData));
      } else if (this.maintenance?.id) {
        result = await firstValueFrom(this.maintenanceService.update(this.maintenance.id, mantenimientoData));
      } else {
        throw new Error('ID de mantenimiento no disponible');
      }

      // Cerrar modal devolviendo el mantenimiento actualizado/creado
      this.modalController.dismiss(result, 'saved');

      const toast = await this.toastController.create({
        message: this.mode === 'create' ? 'Mantenimiento creado correctamente' : 'Mantenimiento actualizado correctamente',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error: any) {
      console.error('Error saving maintenance:', error);
      this.isSaving = false;
      
      // Extraer mensaje de error del backend si está disponible
      let errorMessage = `No se pudo ${this.mode === 'create' ? 'crear' : 'actualizar'} el mantenimiento`;
      
      if (error?.error?.mensaje) {
        errorMessage = error.error.mensaje;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 400) {
        errorMessage = 'Error de validación. Verifica los datos ingresados.';
      }
      
      this.errorMessage = errorMessage;
      
      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 5000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  // Helpers para validación en el template
  get tipoControl() {
    return this.maintenanceForm.get('tipo');
  }

  get fechaControl() {
    return this.maintenanceForm.get('fecha');
  }

  get kmControl() {
    return this.maintenanceForm.get('km');
  }

  get precioControl() {
    return this.maintenanceForm.get('precio');
  }
}
