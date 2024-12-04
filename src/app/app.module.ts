import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from 'src/environments/environment';
import { HttpClientModule } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { TruthyZeroPipe } from './pipes/truthy-zero.pipe';
import { DarkModeService } from './dark-mode.service';

@NgModule({
  declarations: [AppComponent, TruthyZeroPipe],
  imports: [
    BrowserModule,
    IonicModule.forRoot({mode: 'ios'}),
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideMessaging(()=> getMessaging()),
    provideStorage(() => getStorage()),
    HttpClientModule
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy } , DarkModeService],
  bootstrap: [AppComponent],
})
export class AppModule {}
