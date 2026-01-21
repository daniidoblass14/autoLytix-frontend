import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { AuthService } from '../../../../core/services/auth.service';
import { VehiculoResponseDTO } from '../../../../core/models/vehiculo-response.dto';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-update-mileage-modal',
  templateUrl: './update-mileage-modal.component.html',
  styleUrls: ['./update-mileage-modal.component.scss'],
  standalone: false,
})
export class UpdateMileageModalComponent implements OnInit {
  mileageForm!: FormGroup;
  vehicles: VehiculoResponseDTO[] = [];
  isSaving: boolean = false;
  isLoading: boolean = true;

  constructor(
    private modalController: ModalController,
    private vehiclesService: VehiclesService,
    private authService: AuthService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) {
    this.mileageForm = this.fb.group({
      vehiculoId: [null, [Validators.required]],
      kmActuales: [null, [Validators.required, Validators.min(0)]]
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

      // Si hay un solo vehículo, seleccionarlo automáticamente
      if (this.vehicles.length === 1) {
        this.mileageForm.patchValue({ vehiculoId: this.vehicles[0].id });
        this.mileageForm.patchValue({ kmActuales: this.vehicles[0].kmActuales });
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
    const vehicleId = this.mileageForm.get('vehiculoId')?.value;
    const selectedVehicle = this.vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      // Pre-llenar con el kilometraje actual del vehículo
      this.mileageForm.patchValue({ kmActuales: selectedVehicle.kmActuales });
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  async save() {
    if (this.mileageForm.invalid) {
      Object.keys(this.mileageForm.controls).forEach(key => {
        this.mileageForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSaving = true;

    try {
      const formValue = this.mileageForm.value;
      const vehicleId = formValue.vehiculoId;
      const kmActuales = formValue.kmActuales;

      await firstValueFrom(
        this.vehiclesService.updateVehicleKm(vehicleId, kmActuales)
      );

      // Cerrar modal devolviendo éxito
      this.modalController.dismiss({ success: true, vehicleId }, 'saved');

      const toast = await this.toastController.create({
        message: 'Kilometraje actualizado correctamente',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      console.error('Error updating mileage:', error);
      this.isSaving = false;
      
      const toast = await this.toastController.create({
        message: 'No se pudo actualizar el kilometraje',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  get vehicleControl() {
    return this.mileageForm.get('vehiculoId');
  }

  get kmActualesControl() {
    return this.mileageForm.get('kmActuales');
  }

  getVehicleDisplayName(vehicle: VehiculoResponseDTO): string {
    return `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}${vehicle.matricula ? ' - ' + vehicle.matricula : ''}`;
  }
}
