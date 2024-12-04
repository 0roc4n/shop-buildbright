import { Component, OnInit } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { Auth, authState, getAuth, provideAuth } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';
import { PushNotifService } from './services/push-notif.service';
import { firstValueFrom } from 'rxjs';
import { DarkModeService } from './dark-mode.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  darkModeState = false;
  constructor(
              private auth: Auth,
              private pushNotif: PushNotifService,
              private darkModeService: DarkModeService

              ) {
    register();
  }

  async ngOnInit() {

    let userDataStorage:any|null = localStorage.getItem('userData')
    if(userDataStorage) userDataStorage = JSON.parse(userDataStorage)


    const user = await firstValueFrom(authState(this.auth))
    if(user){
      console.log("deep",userDataStorage.userType);
      if(userDataStorage.userType === 'client'){
        console.log("deep",userDataStorage.userType);
        if(user.emailVerified){
          this.pushNotif.initializePushNotifications()
          this.pushNotif.addListener()
        }
        else{
          await this.auth.signOut()
          localStorage.clear()
          sessionStorage.clear()
        }
      }
      else{
        await this.auth.signOut()
        localStorage.clear()
        sessionStorage.clear()
      }

    }

    this.darkModeService.darkModeState$.subscribe((state) => {
      this.darkModeState = state;
      document.body.classList.toggle('dark', this.darkModeState);
    });


  //   const listen = this.fireBase.auth.onAuthStateChanged(async(user)=>{
  //     console.log("LISTENED");
  //     if(user){
  //       this.pushNotif.initializePushNotifications()
  //       this.pushNotif.addListener()
  //       if(environment.loginVerifiedOnly){
  //         if(!user.emailVerified) await this.fireBase.auth.signOut()

  //       }
  //     }
  // })
  // listen()
 }
}
