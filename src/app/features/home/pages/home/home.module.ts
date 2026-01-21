import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';
import { SharedModule } from '../../../../shared/shared.module';
import { VehiclesListPageModule } from '../../../vehicles/pages/vehicles-list/vehicles-list.module';

import { HomePage } from './home.page';
import { UpdateMileageModalComponent } from './update-mileage-modal.component';
import { AddMaintenanceModalComponent } from './add-maintenance-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    HomePageRoutingModule,
    SharedModule,
    VehiclesListPageModule
  ],
  declarations: [
    HomePage,
    UpdateMileageModalComponent,
    AddMaintenanceModalComponent
  ]
})
export class HomePageModule {}
