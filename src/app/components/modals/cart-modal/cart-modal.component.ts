import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AlertController, IonicModule, ModalController, Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, firstValueFrom, lastValueFrom, map, of, switchMap, tap } from 'rxjs';
import { Status } from 'src/app/interfaces/status';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { HelperService } from 'src/app/services/helper.service';
import { OrderService } from 'src/app/services/order.service';
import { ProductService } from 'src/app/services/product.service';
import { MapComponent } from "../../map/map.component";
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifService } from 'src/app/services/push-notif.service';
import { Router } from '@angular/router';
import { CartDetailsComponent } from "../../cart-details/cart-details.component";
@Component({
    selector: 'app-cart-modal',
    templateUrl: './cart-modal.component.html',
    styleUrls: ['./cart-modal.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, ReactiveFormsModule, MapComponent, CartDetailsComponent]
})
export class CartModalComponent  implements OnInit {

  // currentOrder$:Observable<any> = this.orderService
  //   .currentOrder$.pipe(
  //     switchMap((order)=>{
  //       if(order){
  //         return combineLatest([
  //           this.dataQueries.getUserById(order.clientId),
  //           this.dataQueries.getUserById(order.storeId),
  //           combineLatest((order.items as any[]).map((item:any)=>this.dataQueries.getProductById(item.productId,order.storeId)))
  //         ]).pipe(
  //           map((userInfo)=>{
  //             (userInfo[0] as any).address = this.helper.objToArrWithId( (userInfo[0] as any).address)
  //             order.items.forEach((item:any, index:number) => {
  //               order.items[index].productDetails =  userInfo[2][index]
  //             });

  //             return{
  //               ...order,
  //               clientInfo: userInfo[0],
  //               storeInfo: userInfo[1]
  //             }
  //           })
  //         )
  //       }
  //       else return of(null)
  //     }),
  //     tap((order)=>{
  //       console.log('order',order);

  //       if(order?.status === Status.OnDelivery){
  //         this.dataQueries.getRiderLocation(order.riderId).pipe(
  //           tap((riderLocation:any)=>{
  //             console.log("riderLocation",riderLocation);

  //             this.riderLocation$.next({
  //               lat:riderLocation.coords.latitude,
  //               lng:riderLocation.coords.longitude
  //             })
  //           })
  //         ).subscribe()
  //       }

  //     })
  //   )

  // addressSelection:FormControl<any> = this.fb.control(0)
  // method = this.fb.control(null)

  // currentAddress$ = new BehaviorSubject<any>(null)
  // geocoder = new google.maps.Geocoder()

  // riderLocation$ = new ReplaySubject<google.maps.LatLngLiteral>

  constructor(private modalController : ModalController,
              private productService  : ProductService,
              private dataQueries     : DataqueriesService,
              private orderService    : OrderService,
              private fb              : FormBuilder,
              private helper          : HelperService,
              private platform        : Platform,
              private alertController : AlertController,
              private pushNotif       : PushNotifService,
              private router          : Router,) { }

  ngOnInit() {
    // this.riderLocation$?.subscribe((see)=>console.log("see",see)
    // )

    // this.addressSelection.valueChanges.pipe(tap((addressIndex: number)=>{
    //   if(addressIndex < 0){
    //     this.getCurrentLocation()
    //   }
    // })).subscribe()

    // this.currentAddress$.subscribe((see)=>console.log("currentLocation",see)
    // )
  }

  dismiss(){
    this.modalController.dismiss()
  }

  // getStatusResponse(currentOrder:any){


  //   switch (currentOrder.status) {
  //     case Status.Pending:
  //     case Status.Preparing :
  //       return 'Preparing your Order'
  //     case Status.OrderReady:
  //       return 'Your Order is ready for Delivery!'
  //     case Status.OnDelivery:
  //       return 'Your Order is picked up and on your way!'
  //     default:
  //       return 'Error'
  //   }
  // }

  // async getCurrentLocation(){
  //   if(this.platform.is('hybrid')){
  //     const perm = await Geolocation.requestPermissions()
  //     if(perm.location === 'granted'){
  //       const position = await Geolocation.getCurrentPosition()
  //       const center = {
  //         lat: position.coords.latitude,
  //         lng: position.coords.longitude
  //       }
  //       this.currentAddress$.next({
  //         completeAddress: (await this.geocoder.geocode({location:center})).results[0].formatted_address,
  //         coordinates    : center
  //       })
  //       // this.map.googleMap?.setCenter(center)
  //       // this.currentMarker.marker?.setPosition(center)
  //       // this.address = (await this.geocoder.geocode({location:center})).results[0].formatted_address
  //       // this.setAddress(center,this.address)
  //       // console.log("address",this.address);
  //     }
  //   }
  //   else{
  //     navigator.geolocation.getCurrentPosition(async (position)=>{
  //       const center = {
  //         lat: position.coords.latitude,
  //         lng: position.coords.longitude
  //       }
  //       // this.currentAddress$.next(null)
  //       this.currentAddress$.next({
  //         completeAddress: (await this.geocoder.geocode({location:center})).results[0].formatted_address,
  //         coordinates    : center
  //       })
  //       // this.map.googleMap?.setCenter(center)
  //       // this.currentMarker.marker?.setPosition(center)
  //       // this.address = (await this.geocoder.geocode({location:center})).results[0].formatted_address
  //       // this.setAddress(center,this.address)
  //     // console.log("address",this.address);
  //     })
  //   }
  // }

  // async quantityOperation(operation: 1 | -1, currentOrder:any, itemIndex: number, varInd?:number){
  //   const clonedOrder = structuredClone(currentOrder)

  //   if(varInd!==undefined){
  //     const quantity = clonedOrder.items[itemIndex].variants[varInd].quantity + operation
  //     if(quantity > 0){
  //       clonedOrder.items.forEach((item:any)=>{
  //         delete item.productDetails
  //       })
  //       clonedOrder.items[itemIndex].variants[varInd].quantity = quantity
  //       this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //     }
  //     else{
  //       const alert = await this.alertController.create({
  //         header: "Are you sure?",
  //         message: `This will remove the item from your cart`,
  //         buttons:[
  //           {
  //             text:"Cancel",
  //             role:'cancel'},
  //           {
  //             text:"Okay",
  //             role:'ok'

  //           }]
  //       })
  //       alert.present();

  //       if((await alert.onWillDismiss()).role === 'ok'){
  //         clonedOrder.items[itemIndex].variants.splice(varInd,1)

  //         if(clonedOrder.items[itemIndex].variants.length === 0){
  //           clonedOrder.items.splice(itemIndex,1)
  //           if(clonedOrder.items.length === 0){
  //             this.dataQueries.deleteOrder(clonedOrder.id)
  //           }
  //           else{
  //             this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //           }
  //         }
  //         else{
  //           this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //         }
  //         console.log("currorder",clonedOrder);
  //       }
  //     }
  //   }
  //   else{
  //     const quantity = clonedOrder.items[itemIndex].quantity + operation

  //     if(quantity > 0){
  //       clonedOrder.items[itemIndex].quantity = quantity
  //       delete clonedOrder.items[itemIndex].productDetails
  //       console.log("currOrder",clonedOrder.items);
  //       this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //     }
  //     else{
  //       const alert = await this.alertController.create({
  //         header: "Are you sure?",
  //         message: `This will remove the item from your cart`,
  //         buttons:[
  //           {
  //             text:"Cancel",
  //             role:'cancel'},
  //           {
  //             text:"Okay",
  //             role:'ok'

  //           }]
  //       })
  //       alert.present();

  //       if((await alert.onWillDismiss()).role === 'ok'){
  //         clonedOrder.items.splice(itemIndex,1)
  //         if(clonedOrder.items.length === 0){
  //           this.dataQueries.deleteOrder(clonedOrder.id)
  //         }
  //         else{
  //           this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //         }
  //         console.log("currorder",clonedOrder);
  //       }
  //     }
  //   }

  // }

  // paymentData(currentOrder:any){
  //   return currentOrder.items.reduce((prev:number,curr:any)=>{
  //     if(curr.variants){
  //       return curr.variants.reduce((varPrev:number,varCurr:any)=>{
  //         return varCurr.price * varCurr.quantity + varPrev
  //       },0) + prev
  //     }
  //     else return curr.quantity * curr.price + prev
  //   },0)
  // }

  // async placeOrder(addressArray: any, currentOrder:any){
  //   const address = this.addressSelection.value < 0 ? await firstValueFrom(this.currentAddress$) : addressArray[this.addressSelection.value]



  //   this.dataQueries.placeOrder(currentOrder.id,address,this.method.value!)
  //   this.pushNotif.sendMessage(currentOrder.storeInfo.pushNotifKey,currentOrder.id)
  //   this.router.navigate([''])



  //   // if(this.payment) this.payment.method = this.method.value
  //   // await this.orderService.placeOrder(this.orderId,this.address,this.payment)
  //   //
  //   // this.router.navigate(['home'])
  // }

  // disableAddButtons(currentOrder:any, itemIndex: number, varInd?:number){
  //   const currentItem           = currentOrder.items[itemIndex]

  //   if(varInd!==undefined){
  //     const variant               = currentItem.variants[varInd]
  //     const productDetailsVariant = currentItem.productDetails.variants[variant.variantIndex]
  //     return variant.quantity    >= productDetailsVariant.in_stock
  //   }
  //   else{
  //     return currentItem.quantity >= currentItem.productDetails.in_stock
  //   }

  // }

}
