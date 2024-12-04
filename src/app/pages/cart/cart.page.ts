import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, NavController } from '@ionic/angular';
import { ReplaySubject } from 'rxjs';
import { RestaurantProfileComponent } from 'src/app/components/modals/restaurant-profile/restaurant-profile.component';
import { Status } from 'src/app/interfaces/status';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { HelperService } from 'src/app/services/helper.service';
import { OrderService } from 'src/app/services/order.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {

  restaurantData!:any
  currentOrders!:any
  userData!:any
  addresses: any[] = []
  fees!:any
  addressSelection:FormControl<any> = this.fb.control(0)
  from!:string

  // riderLocation = new ReplaySubject<google.maps.LatLngLiteral>(1)
  riderLocation ?: google.maps.LatLngLiteral
  constructor(private navController   : NavController,
              private actRoute        : ActivatedRoute,
              private modalController : ModalController,
              private orderService    : OrderService,
              private dataQueries     : DataqueriesService,
              private helper          : HelperService,
              private alertController : AlertController,
              private router          : Router,
              private fb : FormBuilder) { }

  async ngOnInit() {
    this.actRoute.queryParams.subscribe((param)=>{
      this.from = param['from']
      this.restaurantData = JSON.parse(sessionStorage.getItem('restaurants')!)
        .find((restaurant: any)=> restaurant.id == param['restaurantId'])}
    )
  }

  async back(){
    switch (this.from) {
      case 'restaurant':
        const modal = await this.modalController.create({
          component: RestaurantProfileComponent,
          componentProps: {
            restaurantData: this.restaurantData
          }
        })
        modal.present()
        this.navController.pop()
      break;

      case 'home':
        this.navController.pop()
      break;
    }
  }

  get paymentData(){
    //IDK why these are constants
    const discount = 10
    const charges  = 50
    //to get google maps API
    const distance = 10

    const itemCharges = this.currentOrders?.items.reduce((prev:number,curr:any)=>{
      return curr.unitPrice * curr.qty + prev
      },0)

    const totalDiscount = itemCharges * (discount/100)
    const deliveryFee   = distance    * this.fees?.perKilometer
    const totalPayment  =( itemCharges + charges + deliveryFee ) - totalDiscount

    return {
      totalPayment,
      deliveryFee,
      totalDiscount,
      itemCharges,
      charges
    }

  }

  async addQuantity(itemIndex:number){
    const qty = this.currentOrders.items[itemIndex].qty + 1
    // this.dataQueries.orderList.update(`/${this.currentOrders?.id}/items/${itemIndex}`,{
    //   qty        : qty,
    //   totalPrice : this.currentOrders.items[itemIndex].unitPrice * qty
    // })
  }

  async subtractQuantity(itemIndex:number){
    const qty = this.currentOrders.items[itemIndex].qty - 1

    if(qty > 0){
      // this.dataQueries.orderList.update(`/${this.currentOrders?.id}/items/${itemIndex}`,{
      //   qty        : qty,
      //   totalPrice : this.currentOrders.items[itemIndex].unitPrice * qty
      // })
    }
    else{

      let alert: HTMLIonAlertElement
      if(this.currentOrders.items.length > 1){
        alert = await this.alertController.create({
          header: "Delete Item?",
          message: "Are you sure to delete the item?",
          buttons: ["Cancel",
          {
            text: "Confirm",
            handler: ()=>{
              // this.dataQueries.orderList.remove(`/${this.currentOrders?.id}/items/${itemIndex}`)
            }
          }]
        })
      }
      else{
        alert = await this.alertController.create({
          header:"Cancel Order?",
          message:"Are you sure to cancel this order?",
          buttons: ["Cancel",
          {
            text: "Confirm",
            handler: async ()=>{
              // await this.dataQueries.orderList.remove(`/${this.currentOrders?.id}`)
              this.router.navigate(['home'])
            }
          }]
        })
      }


      alert.present()
    }
  }

  goToCheckOut(){
    const finalAddress = this.userData?.address[this.addressSelection.value!]
    delete finalAddress.id
    console.log(this.addresses, this.addressSelection.value);
    const payment = this.paymentData
    const paymentData = {
      deliveryFee   : payment?.deliveryFee,
      itemTotal     : payment?.itemCharges,
      status        : 0 ,
      toPay         : payment?.totalPayment,
      totalCharges  : payment?.charges,
      totalDiscount : payment?.totalDiscount
    }

    console.log("RESTAURANT", this.restaurantData);

    this.router.navigate(['checkout'],{
      queryParams: {
        address : JSON.stringify(finalAddress),
        paymentData: JSON.stringify(paymentData),
        pushNotifKey: this.restaurantData.pushNotifKey
      },
      skipLocationChange: true,
      replaceUrl: true,
    })
  }

  getStatusResponse(){
    switch (this.currentOrders.status) {
      case Status.Pending:
      case Status.Preparing :
        return 'Preparing your Food'
      case Status.OrderReady:
        return 'Your food is ready!'
      case Status.OnDelivery:
        return 'Your food is picked up and on your way!'
      default:
        return 'Error'
    }
  }


}
