import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CartsPage } from './carts.page';

const routes: Routes = [
  {
    path: 'carts',
    component: CartsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CartsPageRoutingModule {}
