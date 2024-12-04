import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BulksPage } from './bulks.page';

const routes: Routes = [
  {
    path: '',
    component: BulksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BulksPageRoutingModule {}
