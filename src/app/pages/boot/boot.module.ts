import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BootPageRoutingModule } from './boot-routing.module';

import { BootPage } from './boot.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BootPageRoutingModule
  ],
  declarations: [BootPage]
})
export class BootPageModule {}
