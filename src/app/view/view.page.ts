import { Component, EnvironmentInjector, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonMenu } from '@ionic/angular';
import { AuthenticationService } from '../services/authentication.service';
import { PushNotifService } from '../services/push-notif.service';
import { DataqueriesService } from '../services/dataqueries.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.page.html',
  styleUrls: ['./view.page.scss'],
})
export class ViewPage implements OnInit {
  @ViewChild('mainmenu') menu! :IonMenu

  menuList = [
    {
      title: "Shop",
      route: '/shop',
      icon: 'storefront-outline'
    },
    {
      title: "Order History",
      route: '/order-history',
      icon: 'hourglass-outline'
    },
    {
      title: "Reviews",
      route: '/reviews',
      icon: 'star-outline' 
    },
    {
      title: "Privacy & Policy",
      route: '/policies',
      icon: 'eye-outline'
    },
    {
      title: "Contacts",
      route: '/contacts',
      icon: 'call-outline'
    },
    {
      title: "Bulk Order",
      route: '/bulks',
      icon: 'pricetags-outline'
    },
  ]

  constructor(public environmentInjector: EnvironmentInjector,
              private router: Router,
              private auth: AuthenticationService,
              private pushNotif: PushNotifService,
              private dataQueries: DataqueriesService
              ) { }

  ngOnInit() {
    this.pushNotif.initializePushNotifications()
    this.pushNotif.addListener()
  }
  gotoRoute(route:string){
    this.router.navigateByUrl(route)
  }

  address = JSON.parse(localStorage.getItem('userData')!).address;
  changeAdd = this.address.length > 1;
  // changeAdd = false;

  onAddressChange(index:number) {
    // this.selectedAddress = value.completeAddress;
    const user = JSON.parse(localStorage.getItem('userData')!);
    const temp = user.address[0];
    user.address[0] = user.address[index];
    user.address[index] = temp;
    this.changeAdd = false;
    this.dataQueries.updateLocalUser(user);
  }

  async closeMenu(){
    if(await this.menu.isActive() && await this.menu.isOpen()){
      this.menu.close()
    }
  }

  signOut(){
    this.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()

  }
}
