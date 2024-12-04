import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { IonicModule, ModalController } from '@ionic/angular';
import { AddAddressComponent } from '../add-address/add-address.component';
import { Observable, ReplaySubject } from 'rxjs';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { GoogleMapPinsService } from 'src/app/services/google-map-pins.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone:true,
  imports:[IonicModule, CommonModule, GoogleMapsModule]
})
export class ProfileComponent  implements OnInit {


  userData$!: Observable<any>

  addressIndex: any = 0

  mapOptions:google.maps.MapOptions = {
    disableDefaultUI: true,
    clickableIcons: false,
    keyboardShortcuts: false,
  }

  constructor(private modalController: ModalController,
              private dataQueries : DataqueriesService,
              public  googleMapPins: GoogleMapPinsService,
              private router: Router) { }

  async ngOnInit() {
    const userId = JSON.parse(localStorage.getItem('userData')!).id
    this.userData$ = this.dataQueries.getUserById(userId)
    this.userData$.subscribe(see=>{
      console.log("userData",see);

    })
  }

  clickAddressIndex(addrIndex:number){
    this.addressIndex = addrIndex
  }

  async addAddressModal(addressLength: number){
    const modal = await this.modalController.create({
      component: AddAddressComponent,
      componentProps:{
        addressLength: addressLength
      }
    })

    modal.present()
  }


  openLink(link:string){
    window.open(link,'_blank')
  }

  goToViewOrder(){
    this.router.navigate(['/view-order'])
  }
}
