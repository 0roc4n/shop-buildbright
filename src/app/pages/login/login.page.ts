import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { OtpModalComponent } from 'src/app/components/otp-modal/otp-modal.component';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { OtpPinService } from 'src/app/services/otp-pin.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  loginForm: FormGroup = this.fb.group({
    email: [null, [Validators.email, Validators.required]],
    password: [null, [Validators.required, Validators.minLength(6)]]
  })


  passwordInput = {
    type: "password",
    icon: "eye-outline"
  }


  constructor(private fb               : FormBuilder,
              private auth             : AuthenticationService,
              private router           : Router) { }

  ngOnInit() {
  }

  signIn(){
    if(this.loginForm.valid){
        this.auth.signIn(this.loginForm.value.email,this.loginForm.value.password)
    }
  }


  signUp(){
    this.router.navigate(['registration'])
  }

  clickPasswordType(){
    if(this.passwordInput.type === 'password'){
      this.passwordInput = {
        type : 'text',
        icon : 'eye-off-outline'
      }
    }
    else{
      this.passwordInput = {
        type: "password",
        icon: "eye-outline"
      }
    }
  }

  resetPassword(){
    this.auth.resetPassword()
  }




}
