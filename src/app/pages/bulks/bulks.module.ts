import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BulksPageRoutingModule } from './bulks-routing.module';

import { BulksPage } from './bulks.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BulksPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [BulksPage]
})
export class BulksPageModule {}
