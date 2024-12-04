import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { GoogleMap, GoogleMapsModule, MapMarker } from '@angular/google-maps';
import { tap } from 'rxjs';
import { GoogleMapPinsService } from 'src/app/services/google-map-pins.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  imports: [GoogleMapsModule, CommonModule],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit,OnChanges, AfterViewInit{
  @ViewChild('mapRef')          mapRef!         : GoogleMap;
  @ViewChild('riderMarker')     riderMarkerRef! : MapMarker
  @ViewChild('storeMarkerRef')  storeMarkerRef! : MapMarker
  @ViewChild('clientMarkerRef') clientMarkerRef!: MapMarker

  @Input() clientAddressPosition!: google.maps.LatLngLiteral
  @Input() riderPosition?        : google.maps.LatLngLiteral
  @Input() storePosition?        : google.maps.LatLngLiteral

  @Input() height?:string
  @Input() draggable?:boolean
  @Input() zoom?:number

  mapOptions!: google.maps.MapOptions
  // riderIcon: google.maps.Icon = {
  //   url:"assets/icon/rider.svg",
  //   scaledSize: new google.maps.Size(50,50),
  //   anchor: new google.maps.Point(0,50)
  // }

  constructor(public googleMapPins: GoogleMapPinsService) {}


  ngOnInit() {

    console.log("INITIALIZED MAP");

    //assign defaults
    this.height    = this.height    ?? "300px"
    this.draggable = this.draggable === false ? false : true
    this.zoom      = this.zoom      ??  13

    this.mapOptions = {
      disableDefaultUI: true,
      clickableIcons: false,
      keyboardShortcuts: false,
      draggable: this.draggable
    }
  }

  ngAfterViewInit(): void {
    this.clientMarkerRef?.marker?.setPosition(this.clientAddressPosition)
    this.riderMarkerRef?.marker?.setPosition(this.riderPosition)
    this.storeMarkerRef?.marker?.setPosition(this.storePosition)
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(this.clientAddressPosition)
    if(this.riderPosition) {bounds.extend(this.riderPosition)}
    if(this.storePosition) {bounds.extend(this.storePosition)}
    this.mapRef.fitBounds(bounds)

    this.mapRef.googleMap?.addListener('scroll',(event:any)=>{
      console.log(event);
      // event.stopPropagation();
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log("changes",changes);
    this.clientMarkerRef?.marker?.setPosition(this.clientAddressPosition)
    this.riderMarkerRef?.marker?.setPosition(this.riderPosition)
    this.storeMarkerRef?.marker?.setPosition(this.storePosition)

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(this.clientAddressPosition)
    if(this.riderPosition)        {bounds.extend(this.riderPosition)}
    if(this.storePosition)        {bounds.extend(this.storePosition)}
    if(this.clientAddressPosition){bounds.extend(this.clientAddressPosition)}
    this.mapRef?.fitBounds(bounds)
  }




}
