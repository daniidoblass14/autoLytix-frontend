import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { VehicleDetailPageRoutingModule } from './vehicle-detail-routing.module';

import { VehicleDetailPage } from './vehicle-detail.page';
import { EditKilometrajeModalComponent } from './edit-kilometraje-modal.component';
import { EditVehicleModalComponent } from './edit-vehicle-modal.component';
import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    VehicleDetailPageRoutingModule,
    SharedModule
  ],
  declarations: [
    VehicleDetailPage,
    EditKilometrajeModalComponent,
    EditVehicleModalComponent
  ]
})
export class VehicleDetailPageModule {}
