import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OtpPinService {


  constructor(private http: HttpClient,
              private loadingController: LoadingController,
              private alertController: AlertController) { }

  async sendOTP(mobile_no:any){

    const otpSendLoading = await this.loadingController.create({
      message: 'Sending OTP'
    })
    otpSendLoading.present()
    try{
      const pinData = await firstValueFrom(this.http.post<any>(environment.otpAPI.sendPinRequest.url,
        {
          mobile_no:mobile_no
        },
      )
    )
    otpSendLoading.dismiss()
    return pinData
    }
    catch(error){
      otpSendLoading.dismiss()
      const errAlert = await this.alertController.create({
        header: "Something went wrong...",
        message: 'We apoligize for the inconvinience. Please contact out support for more details.',
        buttons: ["OK"]
      })
      
      errAlert.present()
      return false
    }

    
  }


  async verificationAlert(){
    const pinAlert = await this.alertController.create({
      header:'Enter Pin',
      inputs:[{
        placeholder: 'OTP PIN...',
        min:6,
        max:6,
        type: 'tel'
      }],
      backdropDismiss:false,
      buttons:[
        "Cancel",
        {
          text: 'Resend Pin',
          role: 'resend'
        },
        {
          text:"Ok",
          role:"ok"
        }
      ]
    })

    pinAlert.present()
    return await pinAlert.onWillDismiss()
  }

  async verifyOTP(pinData:any, pin:string){
    return firstValueFrom(
      this.http.post(environment.otpAPI.verifyPinRequest.url,{
          ref_code : pinData.ref_code,
          pin      : pin
        }
      )
    )
  }

  async otpExpired(){
    const alert = await this.alertController.create({
      header  : 'PIN expired.',
      message : 'You can send pin again.',
      buttons : [
        "Cancel",
        {
          text:'Ok',
          role:'ok'
        }
      ]  
    })
    alert.present()
    return await alert.onWillDismiss()
  }

  async invalidPIN(){
    const alert = await this.alertController.create({
      header  : 'Invalid PIN.',
      message : 'Cheack and input your pin again.',
      inputs:[{
        placeholder: 'OTP PIN...',
        min:7,
        max:7,
        type: 'tel'
      }],
      buttons : [
        "Cancel",
        {
          text: "Resend PIN",
          role: 'resend'
        },
        {
          text:'Ok',
          role:'ok' 
        }
      ]  
    })
    alert.present()
    return alert.onWillDismiss()
  }

}
