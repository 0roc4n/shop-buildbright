import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BootPage } from './boot.page';

const routes: Routes = [
  {
    path: '',
    component: BootPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BootPageRoutingModule {}
