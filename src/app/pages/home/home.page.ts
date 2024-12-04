import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { RestaurantProfileComponent } from 'src/app/components/modals/restaurant-profile/restaurant-profile.component';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { HelperService } from 'src/app/services/helper.service';
import { OrderService } from 'src/app/services/order.service';
import { PushNotifService } from 'src/app/services/push-notif.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  restaurants!:any[]

  popular!:any[]
  mostSales!:any[]

  constructor(
              private dataQueries: DataqueriesService,
              private helper: HelperService,
              private modalController: ModalController,
              private orderService: OrderService,
              private router: Router,
              private alertController: AlertController,
              // private pushNotif: PushNotifService
              ) {}

  ngOnInit(){
    this.getRestaurants()
    // this.orderService.observeOrder()
  }

  async getRestaurants(){
    // this.restaurants =  this.helper.objToArrWithId((await this.dataQueries.getRestaurants).val())
    this.popular = this.restaurants.sort((a, b) => {
      return b.star - a.star;
    })
    .slice(0, 6);

    this.mostSales = this.restaurants.sort((a, b) => {
      return b.totalSales - a.totalSales;
    })
    .slice(0, 3);

    sessionStorage.setItem('restaurants', JSON.stringify(this.restaurants))
    sessionStorage.setItem('popular'    , JSON.stringify(this.popular))
    sessionStorage.setItem('mostSales'  , JSON.stringify(this.mostSales))
  }


  async goToRestaurant(restaurantData: any){
    console.log(restaurantData);

    const modal = await this.modalController.create({
      component: RestaurantProfileComponent,
      componentProps: {
        restaurantData: restaurantData
      }
    })

    modal.present()
  }

  async goToCart(){


    // this.orderService.order$.subscribe((order:any)=>{
    //   if(order){
    //     if(order.status >=0 && order.status < 3 ){
    //       this.router.navigate(['cart'],{
    //         queryParams:{
    //           restaurantId: order.storeId,
    //           from: 'home'
    //         }
    //       })
    //     }
    //     else this.nothingInCart()
    //   }
    //   else this.nothingInCart()
    // }).unsubscribe()
  }


  async nothingInCart(){
    const alert = await this.alertController.create({
      header: 'No Items in Cart',
      message: 'Your cart is empty.',
      buttons:["Confirm"]
    })
    alert.present()
  }
}
