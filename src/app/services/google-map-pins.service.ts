import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapPinsService {

  clientPin: google.maps.Icon = {
    url:"assets/icon/pins/client_pin.png",
    scaledSize: new google.maps.Size(50,50),
    // anchor: new google.maps.Point(0,50)
  }

  riderPin: google.maps.Icon = {
    url:"assets/icon/pins/rider_pin.png",
    scaledSize: new google.maps.Size(50,50),
    // anchor: new google.maps.Point(0,50)
  }

  storePin: google.maps.Icon = {
    url:"assets/icon/pins/store_pin.png",
    scaledSize: new google.maps.Size(50,50),
    // anchor: new google.maps.Point(0,50)
  }

}
