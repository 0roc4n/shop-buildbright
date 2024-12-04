import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GoogleMapsModule, MapMarker } from '@angular/google-maps';
import { IonInput, IonicModule, ModalController } from '@ionic/angular';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { GoogleMapPinsService } from 'src/app/services/google-map-pins.service';

@Component({
  selector: 'app-add-address',
  templateUrl: './add-address.component.html',
  styleUrls: ['./add-address.component.scss'],
  standalone:true,
  imports:[CommonModule, IonicModule, GoogleMapsModule, ReactiveFormsModule],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAddressComponent  implements OnInit, AfterViewInit {

  @ViewChild('address') address !: IonInput
  @ViewChild('currentMarker') currentMarker!:MapMarker

  addressLength!:number

  mapOptions:google.maps.MapOptions = {
    disableDefaultUI: true,
    clickableIcons: false,
    keyboardShortcuts: false,
  }

  addAddressForm = this.fb.nonNullable.group({
    completeAddress: this.fb.nonNullable.control('',{
      validators: [Validators.required]
    }),
    coordinates: this.fb.nonNullable.group({
     lat: this.fb.nonNullable.control('',{
      validators: [Validators.required]
    }) as FormControl<any>,
     lng: this.fb.nonNullable.control('',{
      validators: [Validators.required]
    }) as FormControl<any>
    }),
    label: this.fb.nonNullable.control('',{
      validators: [Validators.required]
    })
  })

  constructor(
              private modalController : ModalController,
              private fb              : FormBuilder,
              private ref             : ChangeDetectorRef,
              private dataQueries     : DataqueriesService,
              public  googleMapPins   : GoogleMapPinsService
              ) { }

  ngOnInit() {
  }

  async ngAfterViewInit() {

    console.log("address", this.address);

    const input = await this.address.getInputElement()
    const autocomplete = new google.maps.places.Autocomplete(input,{
      componentRestrictions: {
        country:"ph",
      },
    });

    autocomplete.addListener("place_changed", () => {
      const placeLocation = autocomplete.getPlace();

      console.log("placeLocation",placeLocation);

      const coordinates = {
        lat : placeLocation.geometry!.location!.lat(),
        lng : placeLocation.geometry!.location!.lng()
      };

      this.addAddressForm.get('completeAddress')?.setValue(input.value) ;
      this.addAddressForm.get('coordinates')?.setValue(coordinates);

      this.ref.detectChanges()
   });
  }

  dismiss(){
    this.modalController.dismiss()
  }

  get coordinates(){
    const value = this.addAddressForm.get('coordinates')!.value
    if(typeof(value.lat) === 'number' && typeof(value.lng) === 'number'){
      return value as unknown as google.maps.LatLng
    }
    else return false
  }

  mapClicked($event:any){
    console.log("$event",$event.latLng.lat(),$event.latLng.lng() );
    this.addAddressForm.get('coordinates')?.setValue({
      lat:$event.latLng.lat(),
      lng:$event.latLng.lng()
    })
    // (this.addressArray.at(this.focusAddressIndex).get('coordinates') as FormGroup).patchValue({
    //  lat: $event.latLng.lat(),
    //  lng: $event.latLng.lng()
    // })
    this.currentMarker.marker?.setPosition($event.latLng?.toJSON())
  }

  async addAddress(){
    await this.dataQueries.addAddress(this.addressLength, this.addAddressForm.value)
    this.modalController.dismiss()
  }
}
