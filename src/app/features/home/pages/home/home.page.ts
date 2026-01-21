import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AuthService } from '../../../../core/services/auth.service';
import { FormatService } from '../../../../core/services/format.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { 
  DashboardService, 
  DashboardResponse, 
  DashboardStats, 
  DashboardAlert, 
  DashboardActivity 
} from '../../../../core/services/dashboard.service';
import { AddVehicleModalComponent } from '../../../vehicles/pages/vehicles-list/add-vehicle-modal.component';
import { UpdateMileageModalComponent } from './update-mileage-modal.component';
import { AddMaintenanceModalComponent } from './add-maintenance-modal.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isLoading = true;
  error: string | null = null;
  stats: DashboardStats | null = null;
  alerts: DashboardAlert[] = [];
  recentActivity: DashboardActivity[] = [];

  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private formatService: FormatService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    const currentUser = this.authService.getUser();
    
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Llamar al endpoint consolidado del dashboard
    this.dashboardService.getDashboard(5, 5).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response: DashboardResponse) => {
        this.stats = response.stats;
        this.alerts = response.alerts;
        this.recentActivity = response.activity;
        this.isLoading = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.isLoading = false;
        this.error = this.errorHandler.getDashboardErrorMessage(error);
      }
    });
  }

  onRetry() {
    this.loadDashboardData();
  }

  onAddVehicle() {
    this.modalController.create({
      component: AddVehicleModalComponent,
      cssClass: 'add-vehicle-modal'
    }).then(modal => {
      modal.present();
      return modal.onDidDismiss();
    }).then((result) => {
      if (result.role === 'saved') {
        this.loadDashboardData(); // Recargar datos
      }
    });
  }

  onUpdateMileage() {
    this.modalController.create({
      component: UpdateMileageModalComponent,
      cssClass: 'update-mileage-modal'
    }).then(modal => {
      modal.present();
      return modal.onDidDismiss();
    }).then((result) => {
      if (result.role === 'saved') {
        this.loadDashboardData(); // Recargar datos
      }
    });
  }

  onAddMaintenance() {
    this.modalController.create({
      component: AddMaintenanceModalComponent,
      cssClass: 'add-maintenance-modal'
    }).then(modal => {
      modal.present();
      return modal.onDidDismiss();
    }).then((result) => {
      if (result.role === 'saved') {
        this.loadDashboardData(); // Recargar datos
    }
    });
  }

  onViewAlertDetail(alert: DashboardAlert) {
    // Navegar al detalle del vehículo con la alerta
    this.router.navigate(['/vehicles', alert.vehicleId]);
  }

  onViewHistory() {
    // Navegar al historial del primer vehículo con actividad o alerta
    if (this.recentActivity.length > 0) {
      this.router.navigate(['/vehicles', this.recentActivity[0].vehicleId, 'maintenances']);
    } else if (this.alerts.length > 0) {
      this.router.navigate(['/vehicles', this.alerts[0].vehicleId, 'maintenances']);
    } else if (this.stats?.lastKmUpdate) {
      this.router.navigate(['/vehicles', this.stats.lastKmUpdate.vehicleId, 'maintenances']);
    }
  }

  formatKilometers(km: number | null | undefined): string {
    return this.formatService.formatKilometers(km);
  }

  getActivityIcon(activity: DashboardActivity): string {
    switch (activity.type) {
      case 'mileage':
        return 'speedometer'; // Icono velocímetro
      case 'maintenance':
        return 'build'; // Icono herramienta
      case 'vehicle':
        return 'car'; // Icono coche
      default:
        return 'time';
    }
  }
}
