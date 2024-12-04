import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AlertController, IonicModule, LoadingController, ModalController } from '@ionic/angular';
import { NgOtpInputComponent, NgOtpInputModule } from 'ng-otp-input';
import { Config } from 'ng-otp-input/lib/models/config';
import { OtpPinService } from 'src/app/services/otp-pin.service';

@Component({
  selector: 'app-otp-modal',
  templateUrl: './otp-modal.component.html',
  styleUrls: ['./otp-modal.component.scss'],
  standalone:true,
  imports:[CommonModule,IonicModule, NgOtpInputModule]
})
export class OtpModalComponent  implements OnInit {
  
  pinData!   :any
  mobile_no! :any

  otpIncorrect :Boolean = false
  otpExpired   :Boolean = false 


  @ViewChild(NgOtpInputComponent, { static: false}) ngOtpInput!:NgOtpInputComponent;

  otpInput = this.fb.control('', [Validators.minLength(6), Validators.required])
  config:Config = {
    length:6,
    allowNumbersOnly:true,
    inputStyles:{
      "height"    : "45px",
      "width"     : "45px",
      "font-size" : "30px",
      "border"    : "solid"
    }
  }

  constructor(private fb                : FormBuilder,
              private modalController   : ModalController,
              private otpService        : OtpPinService, 
              private alertController   : AlertController,
              private loadingController : LoadingController) { }

  ngOnInit() {
    console.log("pinData", this.pinData);
    console.log("mobile_no",this.mobile_no);
    
  }

  cancelled(){
    this.modalController.dismiss(null,"cancelled")
  }

  async submit(){
    const alert = await this.loadingController.create({
      message:"Verifying"
    }) 
    alert.present()
    try{
      await this.otpService.verifyOTP(this.pinData,this.otpInput.value!)
      alert.dismiss()
      this.modalController.dismiss(null,"success")
    }
    catch(err){
      alert.dismiss()
      if(err instanceof HttpErrorResponse){
        this.ngOtpInput.setValue("")
        this.otpInput.reset()
        if(err.status === 406){
          this.otpIncorrect = true
        }
        else if(err.status === 410){
          this.otpExpired = true
        }

      }
      else console.log("OTHER ERROR", err);
    }
  }

  async resendOtp(){
    this.pinData      = await this.otpService.sendOTP(this.mobile_no)
    this.ngOtpInput.setValue("")
    this.otpInput.reset()
    this.otpIncorrect = false
    this.otpExpired   = false 
  }





}
