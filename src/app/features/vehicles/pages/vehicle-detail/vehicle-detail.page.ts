import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { VehiclesService } from '../../../../core/services/vehicles.service';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormatService } from '../../../../core/services/format.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { getTipoLabel } from '../../../../core/constants/maintenance-types';
import { VehiculoResponseDTO } from '../../../../core/models/vehiculo-response.dto';
import { MantenimientoResponseDTO } from '../../../../core/models/mantenimiento-response.dto';
import { Location } from '@angular/common';
import { EditKilometrajeModalComponent } from './edit-kilometraje-modal.component';
import { EditVehicleModalComponent } from './edit-vehicle-modal.component';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-vehicle-detail',
  templateUrl: './vehicle-detail.page.html',
  styleUrls: ['./vehicle-detail.page.scss'],
  standalone: false,
})
export class VehicleDetailPage implements OnInit {
  vehicle: VehiculoResponseDTO | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  vehicleId: number | null = null;
  lastMaintenanceText: string = 'Sin mantenimientos registrados';
  hasMaintenances: boolean = false;
  lastMaintenanceId: number | null = null;
  lastMaintenanceDate: string | null = null;
  maintenances: MantenimientoResponseDTO[] = [];
  maintenanceAlert: {
    needsMaintenance: boolean;
    overdueKm: number | null;
    overdueType: string | null;
    dueKm: number | null;
  } = {
    needsMaintenance: false,
    overdueKm: null,
    overdueType: null,
    dueKm: null
  };

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehiclesService: VehiclesService,
    private maintenanceService: MaintenanceService,
    private authService: AuthService,
    private formatService: FormatService,
    private errorHandler: ErrorHandlerService,
    private location: Location,
    private modalController: ModalController,
    private toastController: ToastController
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
      
      // Si el ID cambió o es la primera carga, recargar
      if (this.vehicleId !== id) {
        this.vehicleId = id;
        this.loadVehicle(id);
      }
    });
  }

  // Recargar datos cuando la página vuelve a estar activa (desde navegación)
  ionViewWillEnter() {
    if (this.vehicleId) {
      // Recargar datos para asegurar consistencia tras acciones en otras páginas
      this.loadVehicle(this.vehicleId);
    }
  }

  loadVehicle(id: number) {
    this.isLoading = true;
    this.error = null;
    
    this.vehiclesService.getVehicleById(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (vehicle) => {
        this.vehicle = vehicle;
        // Si ya hay mantenimientos cargados, recalcular alerta
        if (this.maintenances.length > 0 && vehicle.kmActuales) {
          this.computeMaintenanceWarning(vehicle.kmActuales, this.maintenances);
        }
        this.loadMaintenances(id);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading vehicle:', error);
        this.isLoading = false;
        
        let errorMessage = this.errorHandler.getUserMessage(error, 'No se pudo cargar el vehículo');
        
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          errorMessage = 'No tienes acceso a este vehículo';
        } else if (error.status === 404) {
          errorMessage = 'Vehículo no encontrado';
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

  loadMaintenances(vehicleId: number) {
    this.maintenanceService.getByVehicleId(vehicleId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (maintenances) => {
        this.maintenances = maintenances || [];
        
        if (this.maintenances.length > 0) {
          // Ordenar por fecha DESC (más reciente primero)
          const sortedMaintenances = this.maintenances.sort((a, b) => {
            const dateA = new Date(a.fecha).getTime();
            const dateB = new Date(b.fecha).getTime();
            return dateB - dateA;
          });
          
          const lastMaintenance = sortedMaintenances[0];
          this.lastMaintenanceId = lastMaintenance.id;
          this.lastMaintenanceDate = lastMaintenance.fecha;
          this.lastMaintenanceText = this.formatService.timeAgo(lastMaintenance.fecha);
          this.hasMaintenances = true;
        } else {
          this.lastMaintenanceText = 'Sin mantenimientos registrados';
          this.hasMaintenances = false;
          this.lastMaintenanceId = null;
          this.lastMaintenanceDate = null;
        }
        
        // Calcular alerta de mantenimiento
        if (this.vehicle?.kmActuales) {
          this.computeMaintenanceWarning(this.vehicle.kmActuales, this.maintenances);
        }
        
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading maintenances:', error);
        this.maintenances = [];
        this.lastMaintenanceText = 'Sin mantenimientos registrados';
        this.hasMaintenances = false;
        this.lastMaintenanceId = null;
        this.lastMaintenanceDate = null;
        this.maintenanceAlert = {
          needsMaintenance: false,
          overdueKm: null,
          overdueType: null,
          dueKm: null
        };
        this.isLoading = false;
        
        // Mostrar toast solo si no es un error crítico
        if (error.status !== 401 && error.status !== 403) {
          const errorMessage = error.error?.mensaje || 'No se pudieron cargar los mantenimientos';
          this.showErrorToast(errorMessage);
        }
      }
    });
  }

  computeMaintenanceWarning(kmActuales: number, mantenimientos: MantenimientoResponseDTO[]) {
    // Filtrar mantenimientos con proximoKm válido
    const mantenimientosConProximoKm = mantenimientos.filter(m => 
      m.proximoKm != null && m.proximoKm > 0
    );

    if (mantenimientosConProximoKm.length === 0) {
      this.maintenanceAlert = {
        needsMaintenance: false,
        overdueKm: null,
        overdueType: null,
        dueKm: null
      };
      return;
    }

    // Encontrar mantenimientos vencidos (kmActuales >= proximoKm)
    const mantenimientosVencidos = mantenimientosConProximoKm.filter(m => 
      kmActuales >= (m.proximoKm || 0)
    );

    if (mantenimientosVencidos.length === 0) {
      // No hay mantenimientos vencidos
      this.maintenanceAlert = {
        needsMaintenance: false,
        overdueKm: null,
        overdueType: null,
        dueKm: null
      };
      return;
    }

    // Encontrar el más urgente (menor proximoKm)
    const mantenimientoUrgente = mantenimientosVencidos.reduce((prev, current) => {
      const prevKm = prev.proximoKm || 0;
      const currentKm = current.proximoKm || 0;
      return currentKm < prevKm ? current : prev;
    });

    const proximoKm = mantenimientoUrgente.proximoKm || 0;
    const overdueKm = kmActuales - proximoKm;

      this.maintenanceAlert = {
        needsMaintenance: true,
        overdueKm: overdueKm,
        overdueType: getTipoLabel(mantenimientoUrgente.tipo),
        dueKm: proximoKm
      };
  }

  getTipoLabel(tipo: string): string {
    return getTipoLabel(tipo);
  }

  formatTimeAgo(lastDate: string | Date): string {
    return this.formatService.timeAgo(lastDate);
  }

  formatKilometers(km: number): string {
    return this.formatService.formatKilometers(km);
  }

  getKilometrajeUpdateText(): string {
    // Usar fechaActualizacionKm del vehículo
    const fechaActualizacionKm = this.vehicle?.fechaActualizacionKm;
    
    if (!fechaActualizacionKm) {
      return 'Sin actualización registrada';
    }
    
    const updateText = this.formatTimeAgo(fechaActualizacionKm);
    
    // Si es muy reciente (menos de 1 minuto), mostrar "hace unos segundos"
    if (updateText.includes('menos de un minuto')) {
      return 'Actualizado hace unos segundos';
    }
    
    // Si es reciente (minutos u horas), mostrar "hoy"
    if (updateText.includes('minutos') || updateText.includes('hora')) {
      return 'Actualizado hoy';
    }
    
    // Si fue ayer
    if (updateText.includes('1 día')) {
      return 'Actualizado ayer';
    }
    
    // Para el resto, mostrar el texto formateado
    return `Actualizado ${updateText.toLowerCase()}`;
  }

  goBack() {
    this.location.back();
  }

  goToVehiclesList() {
    this.router.navigate(['/vehicles']);
  }

  async onEditVehicle() {
    if (!this.vehicle || !this.vehicleId) {
      return;
    }

    const modal = await this.modalController.create({
      component: EditVehicleModalComponent,
      componentProps: {
        vehicle: this.vehicle,
        vehicleId: this.vehicleId
      },
      cssClass: 'edit-vehicle-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    
    // Si se guardó correctamente, actualizar los datos en pantalla
    if (role === 'saved' && data) {
      // Actualizar el vehículo con los datos devueltos
      this.vehicle = data;
      
      // Opcional: recargar desde el servidor para asegurar consistencia
      if (this.vehicleId) {
        this.loadVehicle(this.vehicleId);
      }
    }
  }

  onViewServiceHistory() {
    if (this.vehicle?.id) {
      this.router.navigate(['/vehicles', this.vehicle.id, 'maintenances'], {
        state: {
          vehicleInfo: {
            marca: this.vehicle.marca,
            modelo: this.vehicle.modelo,
            anio: this.vehicle.anio
          }
        }
      });
    }
  }

  onViewMaintenanceHistory() {
    if (this.vehicle?.id) {
      this.router.navigate(['/vehicles', this.vehicle.id, 'maintenances'], {
        state: {
          vehicleInfo: {
            marca: this.vehicle.marca,
            modelo: this.vehicle.modelo,
            anio: this.vehicle.anio
          }
        }
      });
    }
  }

  async onEditKilometraje() {
    if (!this.vehicle || !this.vehicleId) {
      return;
    }

    const modal = await this.modalController.create({
      component: EditKilometrajeModalComponent,
      componentProps: {
        currentKm: this.vehicle.kmActuales,
        vehicleId: this.vehicleId
      },
      cssClass: 'edit-kilometraje-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data && data.newKm) {
      await this.onSaveKilometraje(data.newKm);
    } else {
      // Recargar datos incluso si se canceló, para asegurar consistencia
      if (this.vehicleId) {
        this.loadVehicle(this.vehicleId);
      }
    }
  }

  async onSaveKilometraje(newKm: number) {
    if (!this.vehicleId) {
      return;
    }

    try {
      await firstValueFrom(this.vehiclesService.updateVehicleKm(this.vehicleId, newKm));
      
      // Actualizar UI
      if (this.vehicle) {
        this.vehicle.kmActuales = newKm;
        this.vehicle.fechaActualizacionKm = new Date().toISOString();
        
        // Recalcular alerta de mantenimiento inmediatamente
        this.computeMaintenanceWarning(newKm, this.maintenances);
      }
      
      // Mostrar toast de éxito
      const toast = await this.toastController.create({
        message: 'Kilometraje actualizado',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      // Recargar datos del vehículo para asegurar consistencia
      if (this.vehicleId) {
        // Recargar tanto vehículo como mantenimientos
        this.loadVehicle(this.vehicleId);
      }
    } catch (error) {
      console.error('Error updating kilometraje:', error);
      const toast = await this.toastController.create({
        message: 'No se pudo actualizar el kilometraje',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  getBreadcrumbItems() {
    return [
      { label: 'Mis Vehículos', click: () => this.goToVehiclesList() },
      { label: this.vehicle ? `${this.vehicle.marca} ${this.vehicle.modelo} ${this.vehicle.anio}` : 'Detalles' }
    ];
  }
}
