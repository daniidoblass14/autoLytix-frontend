import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { VehiculoResponseDTO } from '../../../../core/models/vehiculo-response.dto';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-vehicle-modal',
  templateUrl: './edit-vehicle-modal.component.html',
  styleUrls: ['./edit-vehicle-modal.component.scss'],
  standalone: false,
})
export class EditVehicleModalComponent implements OnInit {
  @Input() vehicle: VehiculoResponseDTO | null = null;
  @Input() vehicleId: number | null = null;

  vehicleForm!: FormGroup;
  isSaving: boolean = false;

  constructor(
    private modalController: ModalController,
    private vehiclesService: VehiclesService,
    private toastController: ToastController,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.vehicleForm = this.fb.group({
      matricula: ['', [Validators.required]],
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      anio: [null, [Validators.required, Validators.min(1900), Validators.max(2100)]]
    });
  }

  ngOnInit() {
    // Cargar datos del vehículo en el formulario UNA SOLA VEZ
    if (this.vehicle) {
      this.vehicleForm.patchValue({
        matricula: this.vehicle.matricula || '',
        marca: this.vehicle.marca || '',
        modelo: this.vehicle.modelo || '',
        anio: this.vehicle.anio || null
      });
      
      // Forzar detección de cambios si es necesario
      this.cdr.detectChanges();
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  async save() {
    if (this.vehicleForm.invalid || !this.vehicle || !this.vehicleId) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.vehicleForm.controls).forEach(key => {
        this.vehicleForm.get(key)?.markAsTouched();
      });
      
      if (!this.vehicle || !this.vehicleId) {
        const toast = await this.toastController.create({
          message: 'Error: No se pudo obtener la información del vehículo',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
      return;
    }

    this.isSaving = true;

    try {
      const formValue = this.vehicleForm.value;
      
      // Preparar el body según el endpoint: incluir kmActuales del vehículo actual
      const updateBody = {
        matricula: formValue.matricula,
        marca: formValue.marca,
        modelo: formValue.modelo,
        anio: formValue.anio,
        kmActuales: this.vehicle.kmActuales // Mantener el kilometraje actual
      };

      const updatedVehicle = await firstValueFrom(
        this.vehiclesService.updateVehicle(this.vehicleId, updateBody)
      );

      // Cerrar modal devolviendo el vehículo actualizado
      this.modalController.dismiss(updatedVehicle, 'saved');

      // Mostrar toast de éxito
      const toast = await this.toastController.create({
        message: 'Vehículo actualizado correctamente',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      this.isSaving = false;
      
      const toast = await this.toastController.create({
        message: 'No se pudo actualizar el vehículo',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  // Helpers para validación en el template
  get matriculaControl() {
    return this.vehicleForm.get('matricula');
  }

  get marcaControl() {
    return this.vehicleForm.get('marca');
  }

  get modeloControl() {
    return this.vehicleForm.get('modelo');
  }

  get anioControl() {
    return this.vehicleForm.get('anio');
  }
}
