import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MAINTENANCE_TYPES } from '../../../../core/constants/maintenance-types';
import { VehiculoResponseDTO } from '../../../../core/models/vehiculo-response.dto';
import { MantenimientoRequestDTO } from '../../../../core/models/mantenimiento-request.dto';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-maintenance-modal',
  templateUrl: './add-maintenance-modal.component.html',
  styleUrls: ['./add-maintenance-modal.component.scss'],
  standalone: false,
})
export class AddMaintenanceModalComponent implements OnInit {
  maintenanceForm!: FormGroup;
  vehicles: VehiculoResponseDTO[] = [];
  isSaving: boolean = false;
  isLoading: boolean = true;
  
  maintenanceTypes = MAINTENANCE_TYPES;

  constructor(
    private modalController: ModalController,
    private maintenanceService: MaintenanceService,
    private vehiclesService: VehiclesService,
    private authService: AuthService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) {
    const today = new Date().toISOString().split('T')[0];
    
    this.maintenanceForm = this.fb.group({
      vehiculoId: [null, [Validators.required]],
      tipo: ['', [Validators.required]],
      fecha: [today, [Validators.required]],
      km: [null, [Validators.required, Validators.min(0)]],
      precio: [null, [Validators.required, Validators.min(0)]],
      notas: ['']
    });
  }

  async ngOnInit() {
    await this.loadVehicles();
  }

  async loadVehicles() {
    const currentUser = this.authService.getUser();
    if (!currentUser) {
      const toast = await this.toastController.create({
        message: 'Error: No se pudo obtener la información del usuario',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      this.modalController.dismiss();
      return;
    }

    try {
      this.vehicles = await firstValueFrom(
        this.vehiclesService.getVehicles()
      );
      
      if (this.vehicles.length === 0) {
        const toast = await this.toastController.create({
          message: 'No tienes vehículos registrados',
          duration: 3000,
          color: 'warning',
          position: 'top'
        });
        await toast.present();
        this.modalController.dismiss();
        return;
      }

      // Si hay un solo vehículo, seleccionarlo automáticamente y pre-llenar km
      if (this.vehicles.length === 1) {
        this.maintenanceForm.patchValue({ vehiculoId: this.vehicles[0].id });
        this.maintenanceForm.patchValue({ km: this.vehicles[0].kmActuales });
      }
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading vehicles:', error);
      this.isLoading = false;
      const toast = await this.toastController.create({
        message: 'Error al cargar los vehículos',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      this.modalController.dismiss();
    }
  }

  onVehicleChange() {
    const vehicleId = this.maintenanceForm.get('vehiculoId')?.value;
    const selectedVehicle = this.vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      // Pre-llenar con el kilometraje actual del vehículo
      this.maintenanceForm.patchValue({ km: selectedVehicle.kmActuales });
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  async save() {
    if (this.maintenanceForm.invalid) {
      Object.keys(this.maintenanceForm.controls).forEach(key => {
        this.maintenanceForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSaving = true;

    try {
      const formValue = this.maintenanceForm.value;
      
      // Convertir valores a números (asegurar que no sean strings)
      const km = Number(formValue.km);
      const precio = Number(formValue.precio);
      const selectedVehicle = this.vehicles.find(v => v.id === formValue.vehiculoId);
      
      // Validar que km no sea mayor que el kilometraje actual del vehículo
      if (selectedVehicle && selectedVehicle.kmActuales !== null && km > selectedVehicle.kmActuales) {
        this.isSaving = false;
        const toast = await this.toastController.create({
          message: `El kilometraje del mantenimiento (${km.toLocaleString('es-ES')} km) no puede ser mayor que el kilometraje actual del vehículo (${selectedVehicle.kmActuales.toLocaleString('es-ES')} km). Por favor, actualiza primero el kilometraje del vehículo.`,
          duration: 5000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
        return;
      }
      
      const maintenanceData: MantenimientoRequestDTO = {
        vehiculoId: formValue.vehiculoId,
        tipo: formValue.tipo, // Ya contiene el enum value
        fecha: formValue.fecha,
        km: km, // Asegurar que es número
        precio: precio, // Asegurar que es número
        notas: formValue.notas?.trim() || null
      };

      await firstValueFrom(
        this.maintenanceService.create(maintenanceData)
      );

      // Cerrar modal devolviendo éxito
      this.modalController.dismiss({ success: true }, 'saved');

      const toast = await this.toastController.create({
        message: 'Mantenimiento añadido correctamente',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error: any) {
      console.error('Error creating maintenance:', error);
      this.isSaving = false;
      
      // Extraer mensaje de error del backend si está disponible
      let errorMessage = 'No se pudo añadir el mantenimiento';
      
      if (error?.error?.mensaje) {
        errorMessage = error.error.mensaje;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 400) {
        errorMessage = 'Error de validación. Verifica los datos ingresados.';
      }
      
      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 5000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  get vehicleControl() {
    return this.maintenanceForm.get('vehiculoId');
  }

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

  getVehicleDisplayName(vehicle: VehiculoResponseDTO): string {
    return `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}${vehicle.matricula ? ' - ' + vehicle.matricula : ''}`;
  }
}
