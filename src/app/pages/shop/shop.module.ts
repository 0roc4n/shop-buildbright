import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShopPageRoutingModule } from './shop-routing.module';

import { ShopPage } from './shop.page';
import { CarouselComponent } from "../../components/carousel/carousel.component";
import { CategoriesComponent } from './categories/categories.component';
import { ProductsComponent } from './products/products.component';
import { ShopPageComponent } from './shop-page/shop-page.component';
import { ReviewIconsComponent } from 'src/app/components/review-icons/review-icons.component';
import { CartDetailsComponent } from 'src/app/components/cart-details/cart-details.component';
import { ProfileComponent } from 'src/app/components/profile/profile.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { CartsPage } from '../carts/carts.page';
import { ViewCartComponent } from './view-cart/view-cart.component';

@NgModule({
    declarations: [ShopPage,CategoriesComponent,ProductsComponent,ShopPageComponent, FavoritesComponent, CartsPage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ShopPageRoutingModule,
        CarouselComponent,
        ReactiveFormsModule,
        ReviewIconsComponent,
        CartDetailsComponent,
        ProfileComponent,
        ViewCartComponent
    ]
})
export class ShopPageModule {}
