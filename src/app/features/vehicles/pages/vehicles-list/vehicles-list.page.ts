import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormatService } from '../../../../core/services/format.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { VehiculoResponseDTO } from '../../../../core/models/vehiculo-response.dto';
import { Router } from '@angular/router';
import { AddVehicleModalComponent } from './add-vehicle-modal.component';
import { DeleteVehicleModalComponent } from './delete-vehicle-modal.component';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-vehicles-list',
  templateUrl: 'vehicles-list.page.html',
  styleUrls: ['vehicles-list.page.scss'],
  standalone: false,
})
export class VehiclesListPage implements OnInit {
  vehicles: VehiculoResponseDTO[] = [];
  isLoading: boolean = true;
  currentUser: any = null;
  error: string | null = null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private vehiclesService: VehiclesService,
    private authService: AuthService,
    private formatService: FormatService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private modalController: ModalController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUserAndVehicles();
  }

  loadUserAndVehicles() {
    this.currentUser = this.authService.getUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.vehiclesService.getVehicles().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.isLoading = false;
        this.error = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading vehicles:', error);
        this.isLoading = false;
        this.vehicles = [];
        
        const errorMessage = this.errorHandler.getVehicleLoadErrorMessage(error);
        
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        
        this.error = errorMessage;
        this.showErrorToast(errorMessage);
      }
    });
  }

  async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  onRetry() {
    this.loadUserAndVehicles();
  }

  formatKilometers(km: number): string {
    return this.formatService.formatKilometers(km);
  }

  async onAddVehicle() {
    const modal = await this.modalController.create({
      component: AddVehicleModalComponent,
      cssClass: 'add-vehicle-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    
    // Si se guardó correctamente, recargar la lista de vehículos
    if (role === 'saved' && data) {
      this.loadUserAndVehicles();
    }
  }

  onViewDetails(vehicle: VehiculoResponseDTO) {
    this.router.navigate(['/vehicles', vehicle.id]);
  }

  onViewAlerts(vehicle: VehiculoResponseDTO) {
    // Placeholder - UI sin lógica
  }

  async onDeleteVehicle(vehicle: VehiculoResponseDTO) {
    const modal = await this.modalController.create({
      component: DeleteVehicleModalComponent,
      cssClass: 'delete-vehicle-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data === true) {
      try {
        await firstValueFrom(this.vehiclesService.deleteVehicle(vehicle.id));
        
        // Eliminar el vehículo de la lista local sin recargar
        this.vehicles = this.vehicles.filter(v => v.id !== vehicle.id);

        const toast = await this.toastController.create({
          message: 'Vehículo eliminado correctamente',
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        const toast = await this.toastController.create({
          message: 'No se pudo eliminar el vehículo',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  refreshVehicles(event: any) {
    this.loadUserAndVehicles();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
