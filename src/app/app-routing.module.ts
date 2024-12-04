import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { canActivate , redirectUnauthorizedTo, redirectLoggedInTo, emailVerified, AuthPipeGenerator } from '@angular/fire/auth-guard';
import { ViewCartComponent } from './pages/shop/view-cart/view-cart.component';
import { BootGuard } from './guards/boot/boot.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./view/view.module').then( m => m.ViewPageModule),
    ...canActivate(()=>redirectUnauthorizedTo(['login'])),
    // canActivate: []
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule),
    ...canActivate(()=>redirectLoggedInTo(['view'])),
  },
  {
    path: 'registration',
    loadChildren: () => import('./registration/registration.module').then( m => m.RegistrationPageModule)
  },
  {
    path: 'check-out',
    loadChildren: () => import('./pages/check-out/check-out.module').then( m => m.CheckOutPageModule)
  },
  {
    path: 'view-order',
    loadChildren: () => import('./view-order/view-order.module').then( m => m.ViewOrderPageModule)
  },
  {
    path: 'view-cart',
    component: ViewCartComponent
  },
  {
    path: 'policies',
    loadChildren: () => import('./pages/policies/policies.module').then( m => m.PoliciesPageModule)
  },
  

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
