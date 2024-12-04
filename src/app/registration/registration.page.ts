import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActionSheetController, IonInput, ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource, GalleryImageOptions, ImageOptions } from '@capacitor/camera';
import { AuthenticationService } from '../services/authentication.service';
import { MapMarker } from '@angular/google-maps';
import { OtpPinService } from '../services/otp-pin.service';
import { OtpModalComponent } from '../components/otp-modal/otp-modal.component';
import { Router } from '@angular/router';
@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
})
export class RegistrationPage implements OnInit {
  @ViewChildren("addresses") private addresses!: QueryList<IonInput>;
  @ViewChild('currentMarker') currentMarker! : MapMarker

  registrationForm:FormGroup = this.fb.nonNullable.group({
    profilePic: this.fb.nonNullable.control(''),
    email:this.fb.nonNullable.control('', {
      validators:[Validators.required, Validators.pattern(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)]
    }),
    password:this.fb.nonNullable.control('', {
      validators:[Validators.required, Validators.minLength(6)]
    }),
    fullname: this.fb.nonNullable.group({
      first: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      }),
      middleInitial: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      }),
      last: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      }),
    }),
     facebookPermalink: this.fb.nonNullable.control('',{
       validators: [Validators.required, Validators.pattern(/(?:https?:\/\/)?(?:www\.)?(mbasic.facebook|m\.facebook|facebook|fb)\.(com|me)\/(?:(?:\w\.)*#!\/)?(?:pages\/)?(?:[\w\-\.]*\/)*([\w\-\.]*)/)]
     }),
    address:this.fb.nonNullable.array([
      this.fb.nonNullable.group({
       completeAddress: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      }),
       coordinates: this.fb.nonNullable.group({
        lat: this.fb.nonNullable.control('',{
          validators: [Validators.required]
        }),
        lng: this.fb.nonNullable.control('',{
          validators: [Validators.required]
        })
       }),
       label: this.fb.nonNullable.control('Home',{
        validators: [Validators.required]
      })
      })
    ]),
    ids: this.fb.nonNullable.array([this.fb.nonNullable.group({
      front: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      }),
      back : this.fb.nonNullable.control('',{
        validators: [Validators.required]
      })
    })]),
    userType: 'client',
    verified: false,
    mobile_no : this.fb.nonNullable.control('',{
      validators:[Validators.required, Validators.pattern(/^(09|\+639)\d{9}$/)]
    })
  })


  mapOptions:google.maps.MapOptions = {
    disableDefaultUI: true,
    clickableIcons: false,
    keyboardShortcuts: false,
  }

  cameraOptions:ImageOptions={
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera
  }

  galleryOptions:GalleryImageOptions={
    correctOrientation:true,
    limit : 1
  }

  focusAddressIndex!:number

  passwordInput = {
    type: "password",
    icon: "eye-outline"
  }


  constructor(private fb: FormBuilder,
              private actionSheetController: ActionSheetController,
              private ref: ChangeDetectorRef,
              private auth: AuthenticationService,
              private otpService: OtpPinService,
              private modalController: ModalController,
              private router: Router) { }

  ngOnInit() {
  }


  mapClicked($event:any){
    console.log("$event",$event.latLng.lat(),$event.latLng.lng() );
    (this.addressArray.at(this.focusAddressIndex).get('coordinates') as FormGroup).patchValue({
     lat: $event.latLng.lat(),
     lng: $event.latLng.lng()
    })
    this.currentMarker.marker?.setPosition($event.latLng?.toJSON())
  }

  async pickAvatar(){
    const actionSheet = await this.actionSheetController.create({
      header: 'Get Photo From..',
      buttons: [
        {
          text: 'Camera',
          role: 'camera',
        },
        {
          text: 'Gallery',
          role: 'gallery',
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();

    const selection = await actionSheet.onWillDismiss()
    if(selection.role === 'camera'){
      try{
        const result = await this.fromCamera()
        this.registrationForm.get('profilePic')?.patchValue(result?.webPath)
      }
      catch(err){
        console.log("ERR",err);
      }
    }
    else if(selection.role === 'gallery') {
      try{
        const result = await this.fromGallery()
        this.registrationForm.get('profilePic')?.patchValue(result?.webPath)
      }
      catch(err){
        console.log("ERR",err);
      }
    }
    else{}
  }

  async fromCamera(){
    try{
      const image =  await Camera.getPhoto(this.cameraOptions)
       console.log("fromCamera", image);
       return {
        webPath: image.webPath
       }
    }
    catch(err){
      console.log("Err", err);
      return null
    }

  }

  async fromGallery(){
    try{
    const image = (await Camera.pickImages(this.galleryOptions)).photos[0]
    return {
      webPath: image.webPath
     }
    }
    catch(err){
      console.log("ERR",err);
      return null
    }
  }


  get addressArray(){
    return this.registrationForm.get('address') as FormArray
  }

  scroll($event:any){
    const pacContainers = document.querySelectorAll('.pac-container');
    pacContainers.forEach((container) => {
      (container as HTMLElement).style.display = 'none';
    });
  }

   async getAddressFocus(addressIndex:number){
    this.focusAddressIndex = addressIndex

    const input = await this.addresses.get(addressIndex)!.getInputElement()

    const autocomplete = new google.maps.places.Autocomplete(input,{
      componentRestrictions: {
        country:"ph",
      },
    });


   autocomplete.addListener("place_changed", () => {
      const placeLocation = autocomplete.getPlace();

      console.log("placeLocation",placeLocation);

      const coordinates = {
        lat : placeLocation.geometry?.location?.lat(),
        lng : placeLocation.geometry?.location?.lng()
      };

      (this.addressArray.at(addressIndex) as FormGroup).get('completeAddress')?.patchValue(input.value);

      (this.addressArray.at(addressIndex) as FormGroup).get('coordinates')?.patchValue(coordinates)
      this.ref.detectChanges()
      console.log("GOT IT",(this.addressArray.at(addressIndex) as FormGroup).get('coordinates')?.value);
   });
  }

  removeAddress(addressIndex: number){
    this.addressArray.removeAt(addressIndex)
  }
  addAddress(){
    this.addressArray.push(this.fb.nonNullable.group({
      completeAddress: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      }),
      coordinates: this.fb.nonNullable.group({
       lat: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      }),
       lng: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      })
      }),
      label: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      })
     }))
  }

  get uploadIdArray(){
    return this.registrationForm.get('ids') as FormArray
  }


  deleteIdRow(index:number){
    this.uploadIdArray.removeAt(index)
  }

  async getPhoto(position:string,index?:number){
    const actionSheet = await this.actionSheetController.create({
      header: 'Get Photo From..',
      buttons: [
        {
          text: 'Camera',
          role: 'camera',
        },
        {
          text: 'Gallery',
          role: 'gallery',
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();

    const selection = await actionSheet.onWillDismiss()
    if(selection.role === 'camera'){
      try{
        const result = await this.fromCamera()
        console.log("result",result);
        if(index === undefined){
          (this.registrationForm.get('license') as FormGroup).get(position)?.patchValue(result?.webPath)
        }
        else{
          ((this.registrationForm.get('ids') as FormArray).at(index) as FormGroup).get(position)?.patchValue(result?.webPath)
        }
      }
      catch(err){
        console.log("ERR",err);
      }
    }
    else if(selection.role === 'gallery') {
      try{
        const result = await this.fromGallery()
        console.log("result",result);
        if(index === undefined){
          (this.registrationForm.get('license') as FormGroup).get(position)?.patchValue(result?.webPath)
        }
        else{
          ((this.registrationForm.get('ids') as FormArray).at(index) as FormGroup).get(position)?.patchValue(result?.webPath)
        }
      }
      catch(err){
        console.log("ERR",err);
      }
    }
    else{}
    console.log("selection.role",selection.role);

  }

  addIdRow(){
    this.uploadIdArray.push(this.fb.nonNullable.group({
      front: this.fb.nonNullable.control('',{
        validators: [Validators.required]
      }),
      back : this.fb.nonNullable.control('',{
        validators: [Validators.required]
      })
    }))
  }

  async submit(){
    this.auth.signUp(this.registrationForm.value)
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

  signIn(){
    this.router.navigate(['login'])
  }

}
