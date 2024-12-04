import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginPage } from './login.page';
import { BootGuard } from 'src/app/guards/boot/boot.guard';

const routes: Routes = [
  {
    path: '',
    component: LoginPage,
    canActivate:[BootGuard]
  },
  {
    path: 'boot',
    loadChildren: () => import('../boot/boot.module' ).then( m => m.BootPageModule),
    canActivate: [BootGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
