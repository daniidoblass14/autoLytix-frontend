import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { ModalController, IonInput, ToastController } from '@ionic/angular';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { FormatService } from '../../../../core/services/format.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-kilometraje-modal',
  templateUrl: './edit-kilometraje-modal.component.html',
  styleUrls: ['./edit-kilometraje-modal.component.scss'],
  standalone: false,
})
export class EditKilometrajeModalComponent implements AfterViewInit {
  @Input() currentKm: number = 0;
  @Input() vehicleId: number | null = null;
  @ViewChild('kmInput', { static: false }) kmInput!: IonInput;
  newKm: number | null = null;
  error: string | null = null;
  isSaving: boolean = false;

  constructor(
    private modalController: ModalController,
    private vehiclesService: VehiclesService,
    private formatService: FormatService,
    private toastController: ToastController
  ) {}

  ngAfterViewInit() {
    // Autofocus después de que la vista se inicialice
    setTimeout(() => {
      if (this.kmInput) {
        this.kmInput.setFocus();
      }
    }, 300);
  }

  onInputChange(event: any) {
    const value = event.detail.value;
    this.validateValue(value);
  }

  validateInput() {
    if (this.newKm === null) {
      this.validateValue('');
    }
  }

  validateValue(value: string | number | null) {
    if (value === '' || value === null || value === undefined) {
      this.newKm = null;
      this.error = 'El kilometraje es obligatorio';
      return;
    }

    // Convertir a número entero (sin decimales)
    const numValue = typeof value === 'string' ? parseInt(value, 10) : Math.floor(value);
    
    if (isNaN(numValue)) {
      this.error = 'Introduce un valor válido';
      this.newKm = null;
      return;
    }

    if (numValue <= 0) {
      this.error = 'Introduce un valor válido';
      this.newKm = null;
      return;
    }

    if (numValue < this.currentKm) {
      this.error = 'El kilometraje no puede ser inferior al actual';
      this.newKm = null;
      return;
    }

    this.newKm = numValue;
    this.error = null;
  }

  formatKilometers(km: number): string {
    return this.formatService.formatKilometers(km);
  }

  cancel() {
    this.modalController.dismiss();
  }

  async save() {
    // Validar antes de guardar
    if (this.newKm === null || this.newKm === undefined) {
      this.error = 'El kilometraje es obligatorio';
      return;
    }

    if (this.newKm <= 0) {
      this.error = 'Introduce un valor válido';
      return;
    }

    if (this.newKm < this.currentKm) {
      this.error = 'El kilometraje no puede ser inferior al actual';
      return;
    }

    if (!this.vehicleId) {
      const toast = await this.toastController.create({
        message: 'No se puede actualizar el kilometraje',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      return;
    }

    // Guardar
    this.isSaving = true;
    this.error = null;

    try {
      await firstValueFrom(this.vehiclesService.updateVehicleKm(this.vehicleId, this.newKm));
      
      // Cerrar modal y devolver el valor
      this.modalController.dismiss({ newKm: this.newKm });
    } catch (error) {
      console.error('Error saving kilometraje:', error);
      this.isSaving = false;
      this.error = 'No se pudo actualizar el kilometraje';
      
      const toast = await this.toastController.create({
        message: 'No se pudo actualizar el kilometraje',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }
}
