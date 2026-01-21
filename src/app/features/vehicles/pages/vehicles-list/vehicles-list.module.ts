import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { VehiclesListPageRoutingModule } from './vehicles-list-routing.module';

import { VehiclesListPage } from './vehicles-list.page';
import { AddVehicleModalComponent } from './add-vehicle-modal.component';
import { DeleteVehicleModalComponent } from './delete-vehicle-modal.component';
import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    VehiclesListPageRoutingModule,
    SharedModule
  ],
  declarations: [
    VehiclesListPage,
    AddVehicleModalComponent,
    DeleteVehicleModalComponent
  ],
  exports: [
    AddVehicleModalComponent
  ]
})
export class VehiclesListPageModule {}
