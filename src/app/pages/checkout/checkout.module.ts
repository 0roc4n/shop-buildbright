import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CheckoutPageRoutingModule } from './checkout-routing.module';

import { CheckoutPage } from './checkout.page';
import { MapComponent } from "../../components/map/map.component";
import { NgxPayPalModule } from 'ngx-paypal';

@NgModule({
    declarations: [CheckoutPage],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        CheckoutPageRoutingModule,
        ReactiveFormsModule,
        MapComponent,
        NgxPayPalModule
    ]
})
export class CheckoutPageModule {}
