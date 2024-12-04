import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReviewsPageRoutingModule } from './reviews-routing.module';

import { ReviewsPage } from './reviews.page';
import { ReviewIconsComponent } from 'src/app/components/review-icons/review-icons.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReviewsPageRoutingModule,
    ReviewIconsComponent
  ],
  declarations: [ReviewsPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReviewsPageModule {}
