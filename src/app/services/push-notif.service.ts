import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { DataqueriesService } from './dataqueries.service';
import { } from 'firebase/auth';
import { environment } from 'src/environments/environment';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PushNotifService {

  constructor(private dataQueries: DataqueriesService,
              private http : HttpClient,
              private platform: Platform, ) { }

  async initializePushNotifications(){
    if(this.platform.is('hybrid')){
      console.log('PushNotifications.checkPermissions()', await PushNotifications.checkPermissions());


      const permStatus = await PushNotifications.requestPermissions()
      console.log("Permission Status", permStatus.receive);

      if(permStatus.receive === 'granted'){
        PushNotifications.register();
      }
    }
    else{
      console.info("Push Notification for Web is not yet implemented");
    }
  }

  addListener(){
    if(this.platform.is('hybrid')){
      console.log("Add Listener");

      PushNotifications.addListener('registration',
      (token: Token) => {
        console.log("token.value",token.value);

        localStorage.setItem('pushNotifKey',token.value)
          this.dataQueries.updatePushNotifKey(token.value)
        }
      );
    }
    else{
      console.info("Push Notification for Web is not yet implemented");
    }
  }


  sendMessage(pushNotifToken: string, orderId: string){
    this.http.post(environment.sendPushEndPoint,{
      to: pushNotifToken,
        notification: {
              sound: "default",
              title:"New Order!",
              body: `New Order has been made with Order Id ${orderId}`,
              content_available: true,
              priority:"high"
          },
          data:{
            sound:"default",
            title:"New Order!",
            body:"New Order has been made",
            content_available: true,
            priority:"high"
          }
    },{
      headers:{
        'Authorization' : `key=${environment.serverKey}`,
        'Content-Type'  : 'application/json',
      }
    }).subscribe((see)=>{
      console.log("SEE",see);

    })

  }





}
