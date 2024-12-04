import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViewPageRoutingModule } from './view-routing.module';

import { ViewPage } from './view.page';
import { ScrollbarDirective } from '../directives/scrollbar.directive';
import { DarkModeSwitchComponent } from '../dark-mode-switch/dark-mode-switch.component';

@NgModule({
    declarations: [ViewPage, DarkModeSwitchComponent],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ViewPageRoutingModule,
        ScrollbarDirective,
    ]
})
export class ViewPageModule {}
