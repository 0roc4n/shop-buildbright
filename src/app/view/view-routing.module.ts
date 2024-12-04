import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewPage } from './view.page';
import { FocusGuard } from '../guards/focus.guard';
import { MaintenanceComponent } from '../components/modals/maintenance/maintenance.component';
import { BootGuard } from '../guards/boot/boot.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'shop',
    pathMatch: 'full'
  },
  {
    path:'',
    canActivate:[BootGuard],
    component: ViewPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../pages/home/home.module').then( m => m.HomePageModule),
        
      },
      {
        path: 'cart',
        loadChildren: () => import('../pages/cart/cart.module').then( m => m.CartPageModule)
      },
      {
        path: 'checkout',
        loadChildren: () => import('../pages/checkout/checkout.module').then( m => m.CheckoutPageModule)
      },
      {
        path: 'shop',
        loadChildren: () => import('../pages/shop/shop.module').then( m => m.ShopPageModule)
      },
      {
        path: 'product-details',
        loadChildren: () => import('../pages/product-details/product-details.module').then( m => m.ProductDetailsPageModule)
      },
      {
        path: 'product-filter',
        loadChildren: () => import('../pages/product-filter/product-filter.module').then( m => m.ProductFilterPageModule)
      },
      {
        path: 'order-history',
        loadChildren: () => import('../pages/order-history/order-history.module').then( m => m.OrderHistoryPageModule)
      },
      {
        path: 'reviews',
        loadChildren: () => import('../pages/reviews/reviews.module').then( m => m.ReviewsPageModule)
      },
      {
        path: 'contacts',
        loadChildren: () => import('../pages/contacts/contacts.module').then( m => m.ContactsPageModule)
      },
      {
        path: 'bulks',
        loadChildren: () => import('../pages/bulks/bulks.module').then( m => m.BulksPageModule)
      },
      {
        path: 'maintain',
        component: MaintenanceComponent
      },

      
    ]
  },
  {
    path: 'boot',
    loadChildren: () => import('../pages/boot/boot.module' ).then( m => m.BootPageModule),
    canActivate: [BootGuard]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViewPageRoutingModule {}
