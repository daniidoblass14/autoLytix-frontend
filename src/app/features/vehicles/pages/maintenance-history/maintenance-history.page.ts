import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController, AlertController, PopoverController } from '@ionic/angular';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormatService } from '../../../../core/services/format.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { getTipoLabel, getTipoIcon } from '../../../../core/constants/maintenance-types';
import { MantenimientoResponseDTO } from '../../../../core/models/mantenimiento-response.dto';
import { Location } from '@angular/common';
import { EditMaintenanceModalComponent } from './edit-maintenance-modal.component';
import { MaintenanceActionsPopoverComponent } from './maintenance-actions-popover.component';
import { DeleteMaintenanceModalComponent } from './delete-maintenance-modal.component';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-maintenance-history',
  templateUrl: './maintenance-history.page.html',
  styleUrls: ['./maintenance-history.page.scss'],
  standalone: false,
})
export class MaintenanceHistoryPage implements OnInit {
  maintenances: MantenimientoResponseDTO[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  vehicleId: number | null = null;
  vehicleInfo: { marca: string; modelo: string; anio: number } | null = null;
  currentVehicleKm: number | null = null; // Kilometraje actual del vehículo

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private maintenanceService: MaintenanceService,
    private vehiclesService: VehiclesService,
    private authService: AuthService,
    private formatService: FormatService,
    private errorHandler: ErrorHandlerService,
    private location: Location,
    private modalController: ModalController,
    private toastController: ToastController,
    private popoverController: PopoverController
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const id = parseInt(params['id'], 10);
      if (isNaN(id)) {
        this.error = 'ID de vehículo inválido';
        this.isLoading = false;
        return;
      }
      this.vehicleId = id;
      this.loadMaintenances(id);
      this.loadVehicleKm(id); // Cargar kilometraje actual del vehículo
    });

    // Obtener info del vehículo desde el estado de navegación si está disponible
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.vehicleInfo = navigation.extras.state['vehicleInfo'];
    }
  }

  loadVehicleKm(vehicleId: number) {
    this.vehiclesService.getVehicleById(vehicleId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (vehicle) => {
        this.currentVehicleKm = vehicle.kmActuales || null;
      },
      error: () => {
        // Si falla, no es crítico, solo no validaremos km
        this.currentVehicleKm = null;
      }
    });
  }

  loadMaintenances(vehicleId: number) {
    this.isLoading = true;
    this.error = null;
    
    this.maintenanceService.getByVehicleId(vehicleId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (maintenances) => {
        // Ordenar por fecha DESC (más reciente primero)
        // Usar función segura para parsear fechas
        this.maintenances = maintenances.sort((a, b) => {
          const dateA = this.parseDateSafe(a.fecha);
          const dateB = this.parseDateSafe(b.fecha);
          
          // Si alguna fecha es inválida, ponerla al final
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          
          return dateB.getTime() - dateA.getTime();
        });
        this.isLoading = false;
        this.error = null;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading maintenances:', error);
        this.isLoading = false;
        this.maintenances = [];
        
        let errorMessage = this.errorHandler.getMaintenanceHistoryErrorMessage(error);
        
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para ver este historial';
        } else if (error.status === 404) {
          errorMessage = 'Historial no encontrado';
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

  /**
   * Parsea una fecha de forma segura, devolviendo Date o null si es inválida
   * @param dateInput Fecha como string, Date, number o null/undefined
   * @returns Date válida o null
   */
  private parseDateSafe(dateInput: any): Date | null {
    if (!dateInput) return null;
    
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    if (typeof dateInput === 'number') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    
    if (typeof dateInput === 'string') {
      // Intentar parsear directamente
      let date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Intentar parsear formato YYYY-MM-DD manualmente
      const ymdMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        
        if (year >= 1900 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
          date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            // Verificar que la fecha creada coincide con los valores esperados
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
              return date;
            }
          }
        }
      }
    }
    
    return null;
  }

  formatDate(dateString: string | Date | number | null | undefined): string {
    return this.formatService.formatDate(dateString);
  }

  formatKilometers(km: number): string {
    return this.formatService.formatKilometers(km);
  }

  formatPrice(price: number): string {
    return this.formatService.formatPrice(price);
  }

  getTipoLabel(tipo: string): string {
    return getTipoLabel(tipo);
  }

  getTipoIcon(tipo: string): string {
    return getTipoIcon(tipo);
  }

  goBack() {
    if (this.vehicleId) {
      this.router.navigate(['/vehicles', this.vehicleId]);
    } else {
      this.location.back();
    }
  }

  getBreadcrumbItems() {
    if (this.vehicleInfo) {
      return [
        { label: 'Detalles del Vehículo', click: () => this.goBack() },
        { label: 'Historial de Servicios' }
      ];
    }
    return [
      { label: 'Historial de Servicios' }
    ];
  }

  retry() {
    if (this.vehicleId) {
      this.loadMaintenances(this.vehicleId);
    }
  }

  async onAddMaintenance() {
    if (!this.vehicleId) {
      return;
    }

    const modal = await this.modalController.create({
      component: EditMaintenanceModalComponent,
      componentProps: {
        mode: 'create',
        vehicleId: this.vehicleId,
        currentVehicleKm: this.currentVehicleKm
      },
      cssClass: 'edit-maintenance-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'saved' && this.vehicleId) {
      // Recargar la lista de mantenimientos y actualizar km del vehículo
      this.loadMaintenances(this.vehicleId);
      this.loadVehicleKm(this.vehicleId);
    }
  }

  async onEditMaintenance(maintenance: MantenimientoResponseDTO) {
    if (!this.vehicleId) {
      return;
    }

    const modal = await this.modalController.create({
      component: EditMaintenanceModalComponent,
      componentProps: {
        mode: 'edit',
        vehicleId: this.vehicleId,
        maintenance: maintenance,
        currentVehicleKm: this.currentVehicleKm
      },
      cssClass: 'edit-maintenance-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'saved' && this.vehicleId) {
      // Recargar la lista de mantenimientos y actualizar km del vehículo
      this.loadMaintenances(this.vehicleId);
      this.loadVehicleKm(this.vehicleId);
    }
  }

  async openActionMenu(maintenance: MantenimientoResponseDTO, event: Event) {
    event.stopPropagation();
    
    const popover = await this.popoverController.create({
      component: MaintenanceActionsPopoverComponent,
      event: event,
      componentProps: {
        maintenance: maintenance,
        onEditCallback: (m: MantenimientoResponseDTO) => {
          this.onEditMaintenance(m);
        },
        onDeleteCallback: (m: MantenimientoResponseDTO) => {
          this.onDeleteMaintenance(m);
        }
      },
      cssClass: 'maintenance-actions-popover',
      showBackdrop: true,
      backdropDismiss: true,
      translucent: false,
      side: 'bottom',
      alignment: 'end'
    });

    await popover.present();
  }

  async onDeleteMaintenance(maintenance: MantenimientoResponseDTO) {
    const modal = await this.modalController.create({
      component: DeleteMaintenanceModalComponent,
      componentProps: {
        maintenance: maintenance,
        tipoLabel: this.getTipoLabel(maintenance.tipo),
        fechaFormateada: this.formatDate(maintenance.fecha),
        kmFormateado: this.formatKilometers(maintenance.km)
      },
      cssClass: 'autolytix-delete-maintenance-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data === true) {
      // Usuario confirmó la eliminación
      try {
        await firstValueFrom(this.maintenanceService.delete(maintenance.id));
        
        // Recargar la lista
        if (this.vehicleId) {
          this.loadMaintenances(this.vehicleId);
        }

        const toast = await this.toastController.create({
          message: 'Mantenimiento eliminado',
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      } catch (error) {
        console.error('Error deleting maintenance:', error);
        const toast = await this.toastController.create({
          message: 'No se pudo eliminar el mantenimiento',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    }
  }
}
