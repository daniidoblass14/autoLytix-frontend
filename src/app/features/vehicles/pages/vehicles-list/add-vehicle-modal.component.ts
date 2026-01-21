import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { AuthService } from '../../../../core/services/auth.service';
import { VehiculoResponseDTO } from '../../../../core/models/vehiculo-response.dto';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-vehicle-modal',
  templateUrl: './add-vehicle-modal.component.html',
  styleUrls: ['./add-vehicle-modal.component.scss'],
  standalone: false,
})
export class AddVehicleModalComponent implements OnInit {
  vehicleForm!: FormGroup;
  isSaving: boolean = false;
  currentYear: number = new Date().getFullYear();
  years: number[] = [];

  constructor(
    private modalController: ModalController,
    private vehiclesService: VehiclesService,
    private authService: AuthService,
    private toastController: ToastController,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // Generar años desde 1980 hasta el año actual
    for (let year = this.currentYear; year >= 1980; year--) {
      this.years.push(year);
    }

    this.vehicleForm = this.fb.group({
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      anio: [null, [Validators.required, Validators.min(1980), Validators.max(this.currentYear)]],
      matricula: [''],
      kmActuales: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.cdr.detectChanges();
  }

  cancel() {
    this.modalController.dismiss();
  }

  async save() {
    if (this.vehicleForm.invalid) {
      Object.keys(this.vehicleForm.controls).forEach(key => {
        this.vehicleForm.get(key)?.markAsTouched();
      });
      return;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser) {
      const toast = await this.toastController.create({
        message: 'Error: No se pudo obtener la información del usuario',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      return;
    }

    this.isSaving = true;

    try {
      const formValue = this.vehicleForm.value;
      
      const createBody = {
        matricula: formValue.matricula || '',
        marca: formValue.marca,
        modelo: formValue.modelo,
        anio: formValue.anio,
        kmActuales: formValue.kmActuales
      };

      const newVehicle = await firstValueFrom(
        this.vehiclesService.createVehicle(createBody)
      );

      // Cerrar modal devolviendo el vehículo creado
      this.modalController.dismiss(newVehicle, 'saved');

      const toast = await this.toastController.create({
        message: 'Vehículo añadido correctamente',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      this.isSaving = false;
      
      const toast = await this.toastController.create({
        message: 'No se pudo añadir el vehículo',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  // Helpers para validación en el template
  get marcaControl() {
    return this.vehicleForm.get('marca');
  }

  get modeloControl() {
    return this.vehicleForm.get('modelo');
  }

  get anioControl() {
    return this.vehicleForm.get('anio');
  }

  get kmActualesControl() {
    return this.vehicleForm.get('kmActuales');
  }
}
