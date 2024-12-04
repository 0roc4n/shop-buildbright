import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CartPageRoutingModule } from './cart-routing.module';

import { CartPage } from './cart.page';
import { MapComponent } from "../../components/map/map.component";

@NgModule({
    declarations: [CartPage],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        CartPageRoutingModule,
        ReactiveFormsModule,
        MapComponent
    ]
})
export class CartPageModule {}
