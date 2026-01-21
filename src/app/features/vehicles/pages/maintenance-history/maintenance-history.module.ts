import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MaintenanceHistoryPageRoutingModule } from './maintenance-history-routing.module';

import { MaintenanceHistoryPage } from './maintenance-history.page';
import { EditMaintenanceModalComponent } from './edit-maintenance-modal.component';
import { MaintenanceActionsPopoverComponent } from './maintenance-actions-popover.component';
import { DeleteMaintenanceModalComponent } from './delete-maintenance-modal.component';
import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    MaintenanceHistoryPageRoutingModule,
    SharedModule
  ],
  declarations: [
    MaintenanceHistoryPage,
    EditMaintenanceModalComponent,
    MaintenanceActionsPopoverComponent,
    DeleteMaintenanceModalComponent
  ]
})
export class MaintenanceHistoryPageModule {}
