import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { FirebaseApp, FirebaseError, initializeApp } from 'firebase/app';

import { Auth, getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';
import { DataqueriesService } from './dataqueries.service';
import { DataStorageService } from './data-storage.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OtpPinService } from './otp-pin.service';
import { OtpModalComponent } from '../components/otp-modal/otp-modal.component';

enum FirebaseErrorCode{
  NoUserFound = 'auth/user-not-found',
  WrongPassword = 'auth/wrong-password'
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(
                private auth              : Auth,
                private loadingCtrl       : LoadingController,
                private router            : Router,
                private alertCtrl         : AlertController,
                private dataQueries       : DataqueriesService,
                private loadingController : LoadingController,
                private alertController   : AlertController,
                private dataStorage       : DataStorageService,
                private otpService        : OtpPinService,
                private modalController   : ModalController
             ) { }

  async signIn(email:string, password: string){
    const loading  = await this.loadingCtrl.create({
      message: 'Authenticating...'
    })
    loading.present()
    try{
      const user = (await this.dataQueries.getUserData(email))?.[0] as any

      if(user?.userType === 'client'){
        if(user.verified){
          await this.signInProcess(user,email,password)
          // loading.dismiss()
          // if(await this.otpSignIn(user.mobile_no) === 'success'){
          //   await this.signInProcess(user,email,password)
          // }
        }
        else{
          this.fbNotVerified()
        }
      }
      else{
        this.noUserAlert()
      }
      loading.dismiss()
    }
    catch(error){
      console.error("ERROR", error);
      loading.dismiss()
      if(error instanceof FirebaseError){
        console.log("code",error.code);
        this.errorLoginAlert(error.code as FirebaseErrorCode)
      }
    }
  }

  async signInProcess(user:any,email:string,password:string){

    const authData = await signInWithEmailAndPassword(this.auth, email, password)
    if(authData.user.emailVerified){
      localStorage.setItem('userData',JSON.stringify(user))
      this.router.navigateByUrl('')
    }
    else{
      signOut(this.auth)
      this.emailNotVerified()
    }

  }

  async errorLoginAlert(error:FirebaseErrorCode){
    let header:string = ''
    let message:string = ''
    switch(error){
      case FirebaseErrorCode.NoUserFound:
        header  = "No User"
        message = "There was no user with the email that you submitted. Please check and try again."
      break;
      case FirebaseErrorCode.WrongPassword:
        header  = "Incorrect Password"
        message = "Your password is incorrect. Please try again."
      break;
    }

    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: ["OK"]
    })
    alert.present()

  }

  async signOut(){
    const loading  = await this.loadingCtrl.create({
      message: 'Signing Out...'
    })
    await loading.present()
    try{
      await signOut(this.auth)
      window.location.reload()
    }
    catch{
    }
  }

  async signUp(registrationFormValue:any){
    const loading = await this.loadingController.create({
      message:'Creating User...'
    })

    loading.present()
    if(await this.checkEmailNotExist(registrationFormValue.email)){
      const registrationValue       = structuredClone(registrationFormValue)
      const userKey                 = this.dataQueries.createUserKey()
      registrationValue.profilePic  = registrationValue.profilePic == '' ? '' : await this.dataStorage.uploadProfilePic( userKey!,(await(await fetch(registrationValue.profilePic)).blob()))
      registrationValue.ids         = await this.dataStorage.uploadIds(userKey!,registrationValue.ids)
      await createUserWithEmailAndPassword(this.auth,registrationValue.email,registrationValue.password)
      await this.dataQueries.updateUser(userKey!,registrationValue)
      loading.dismiss()
      await this.sendVerification()
      await this.waitForVerification()
    }
    else {
      loading.dismiss()
      const alert = await this.alertController.create({
        header: 'Email already exist!',
        message: 'Please check your account with our admin.',
        buttons:["Ok"]
      })
      alert.present()
    }


  }


  async checkEmailNotExist(email:string){
    if((await firstValueFrom(this.dataQueries.getUsersByEmail(email)))?.length){
      return false
    }
    else return true
  }


  async sendVerification(){
    const loading = await this.loadingController.create({
      message: 'Sending Verification Email'
    })
    await loading.present()
    await sendEmailVerification(this.auth.currentUser!)
    await loading.dismiss()
  }

  async waitForVerification(){
    const alert = await this.alertController.create({
                          header          : 'Verify your email',
                          message         : 'Please check your email to verify your account',
                          backdropDismiss ​: false,
                          buttons         : [
                          {
                            text: "Done",
                            handler: async ()=>{
                              const user = this.auth.currentUser!
                              await user.reload()
                              if(user.emailVerified){
                                await this.checkVerification()
                                await this.forVerification()
                              }
                              else{
                                await this.stillUnverified()
                              }

                            }
                          }]
                        });

    await alert.present()
    await alert.onDidDismiss()
  }

  checkVerification(){
    console.log("checkVerification");
    return new Promise((resolve, reject)=>{
      this.auth.onIdTokenChanged((user)=>{
        user?.emailVerified ? resolve(true): null
      })
    })

  }

  async forVerification(){
    const alert = await this.alertController.create({
      header : "For Verification",
      message: "Your account is now submitted and under verification. For now you cannot login. Please wait until we verify you. Thank you.",
      buttons: ["Okay"]
    })

    alert.present()
    await alert.onWillDismiss()
    await this.auth.signOut()
    this.router.navigate(['login'])
  }

  async stillUnverified(){

    const alert = await this.alertController.create({
      header  : 'Still Unverified',
      message : 'You still seem to be unverified. Resend verification and try again.',
      buttons: [{
        text:'Done',
        handler: async ()=>{
          await alert.dismiss()
          // const state =
          const user = this.auth.currentUser!
          await user.reload()
          if(user.emailVerified){
            await this.checkVerification()
            await this.forVerification()
            // await this.auth.signOut()
            // this.router.navigate(['login'])
          }
          else{
            await this.stillUnverified()
          }

        }
      }]
    })
  }

  async noUserAlert(){
    const alert = await this.alertController.create({
      header : "No User Found",
      message: "We dont have an existing record of your account. Please try again.",
      buttons: ["Okay"]
    })
    alert.present()
  }

  async fbNotVerified(){
    const alert = await this.alertController.create({
      header : "To be Verified",
      message: "Your account is still under verification. Please try to log in later.",
      buttons: ["Okay"]
    })
    alert.present()
  }

  async emailNotVerified(){
    const alert = await this.alertController.create({
      header : "Email Not Verified",
      message: "Check your email to get verified.",
      buttons: ["Okay"]
    })
    alert.present()
  }

  async resetPassword(){
    const alert = await this.alertController.create({
      header:"Reset password",
      message:"Input your email to reset your password",
      inputs:[{
        placeholder: "Email...",
      }],
      buttons:[
        "Cancel",
        {
          text: "OK",
          role: "ok"
        }
      ]
    })
    alert.present()
    const flag =  await alert.onWillDismiss()

    if(flag.role === 'ok'){
      const pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
      const email = flag.data.values[0]

      if(flag.data[0] === '' || !pattern.test(email)){
        this.invalidEmail(
          'Invalid Email',
          'Please try again'
        )
      }
      else{
        try{
          await sendPasswordResetEmail(this.auth, email);
          (await this.alertController.create({
            header:'Email sent!',
            message: 'See your email inbox to reset your password.',
            buttons:['OK']
          })).present()
        }
        catch(err){
          if( err instanceof  FirebaseError){
            console.log("ERROR Firebase", err);
            if(err.code === 'auth/user-not-found'){
              this.invalidEmail(
                'Email not found.',
                'There are no existing records of this email in our app. Please check your email again or register.'
              )
            }
          }
          else{
            console.log("ERROR something else", err);

          }


        }
      }
    }


  }

  async invalidEmail(header:string, message:string ){
    const alert = await  this.alertController.create({
      header  : header,
      message : message,
      buttons : ["OK"]
    })
    alert.present()
    await alert.onWillDismiss()
    this.resetPassword()
  }

  async otpSignIn(mobile_no:string){
    const pinData =await this.otpService.sendOTP(mobile_no)
    if(pinData){
      const modal = await this.modalController.create({
        component: OtpModalComponent,
        componentProps:{
          pinData  : pinData,
          mobile_no: mobile_no
        }
      })
      modal.present()
      const flag = await modal.onWillDismiss()
      console.log("flag.role",flag.role);
      return flag.role
    }
    else return false


  }




}
