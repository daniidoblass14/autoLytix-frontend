import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VehiclesListPage } from './vehicles-list.page';

const routes: Routes = [
  {
    path: '',
    component: VehiclesListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VehiclesListPageRoutingModule {}
