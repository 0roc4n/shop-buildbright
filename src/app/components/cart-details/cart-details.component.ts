import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController, IonContent, IonicModule, ModalController, Platform } from '@ionic/angular';
import { MapComponent } from '../map/map.component';
import { BehaviorSubject, Observable, ReplaySubject, bindCallback, combineLatest, distinctUntilChanged, first, firstValueFrom, map, of, startWith, switchMap, take, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Status } from 'src/app/interfaces/status';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { HelperService } from 'src/app/services/helper.service';
import { OrderService } from 'src/app/services/order.service';
import { ProductService } from 'src/app/services/product.service';
import { PushNotifService } from 'src/app/services/push-notif.service';
import { AddAddressComponent } from '../add-address/add-address.component';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapPinsService } from 'src/app/services/google-map-pins.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ICreateOrderRequest, NgxPayPalModule } from 'ngx-paypal';

declare var paypal: any;
@Component({
  selector: 'app-cart-details',
  templateUrl: './cart-details.component.html',
  styleUrls: ['./cart-details.component.scss'],
  standalone: true,
  imports:[CommonModule, IonicModule, ReactiveFormsModule, MapComponent, GoogleMapsModule]
})
export class CartDetailsComponent  implements OnInit , AfterViewInit{

  @ViewChild('mapRef')mapRef!: GoogleMap;
  geocoder = new google.maps.Geocoder()
  riderLocation$ = new ReplaySubject<google.maps.LatLngLiteral>
  addressSelection:FormControl<any> = this.fb.control(0)
  purchase_type = this.fb.control('ind')


  chatMessageInput = this.fb.control(null)
  chatInput = this.fb.control(null)
  specialInstructions = this.fb.control(null)

  storeCoordinates!:google.maps.LatLng
  priceDistanceCache:any[] = []

  currentOrder$:Observable<any> = this.orderService
  .currentOrder$.pipe(
    tap((order)=>{
      console.log("Order",order);
      if(order?.status === Status.InCart){
        this.storeCoordinates = order.storeInfo.branches[0].coordinates
        if(this.addressSelection.value >=0){
          this.distanceCalculation(order.clientInfo.address[this.addressSelection.value].coordinates)
        }
      }

      if(order?.status === Status.OnDelivery){
        this.dataQueries.getRiderLocation(order.riderId).pipe(
          tap((riderLocation:any)=>{
            console.log("riderLocation",riderLocation);

            this.riderLocation$.next({
              lat:riderLocation.coords.latitude,
              lng:riderLocation.coords.longitude
            })
          })
        ).subscribe()
      }
    })
  )

  currentAddress$ = new BehaviorSubject<any>(null)

  method = this.fb.control('delivery', Validators.required)

  mapOptions:google.maps.MapOptions = {
    disableDefaultUI: true,
    clickableIcons: false,
    keyboardShortcuts: false,
  }

  openPaymentComponent:boolean = false
  deliveryDateType    = this.fb.control('', Validators.required)

  dateToday           = new Date().toISOString()
  deliveryDate        = this.fb.control(this.dateToday, Validators.required)
  vouchers$           = this.dataQueries.getAvailableVouchers()
  voucherSelection    = this.fb.control('',Validators.required)


  storeLocation!: google.maps.LatLng
  cachedDistanceArray:any[] = []

  paypalButton?:any


  distanceService = new google.maps.DistanceMatrixService()

  pricePerDistance$ = this.dataQueries.getPricePerDistance()
  fetchedDistance$ = new BehaviorSubject<any>(null)
  calculatedPriceDistance$ = this.pricePerDistance$.pipe(
    switchMap((ppd)=>
      this.fetchedDistance$.pipe(
        map((fetched)=>{
          if(fetched){
            if(typeof(fetched)!== 'string'){
              let fetchedPrice = null
              if(fetched.distance.value < (<any>ppd![1]).distance){
                fetchedPrice = (<any>ppd![0])
              }
              else if(fetched.distance.value >= (<any>ppd![ppd!.length-1]).distance){
                fetchedPrice = (<any>ppd![ppd!.length-1])
              }
              else{
                const allowedArr = ppd!.filter((ppdObj:any)=> ppdObj.distance <= fetched.distance.value)
                fetchedPrice = allowedArr[allowedArr.length -1 ]
              }
              return {
                calculated : fetchedPrice,
                actualDistance:  fetched
              }
            }
            return fetched
          }
          return fetched
        })
      )
    )
  )

  placeOrderValidation$!: Observable<any>

  constructor(
    private productService  : ProductService,
    private dataQueries     : DataqueriesService,
    private orderService    : OrderService,
    private fb              : FormBuilder,
    private helper          : HelperService,
    private platform        : Platform,
    private alertController : AlertController,
    private pushNotif       : PushNotifService,
    private router          : Router,
    private modalController : ModalController,
    public  googleMapPins   : GoogleMapPinsService,
    private http            : HttpClient,
  ) { }


  ngOnInit() {
    this.riderLocation$?.subscribe()

    this.addressSelection.valueChanges.pipe(tap((addressIndex: number)=>{
      if(addressIndex < 0){
        this.getCurrentLocation()
      }
    })).subscribe()

    this.placeOrderValidation$ = combineLatest([
      this.method.statusChanges.pipe(
        startWith(this.method.status)
      ),
      this.deliveryDateType.statusChanges.pipe(
        startWith(this.deliveryDateType.status)
      ),
      this.calculatedPriceDistance$
    ]).pipe(
      map((validation)=>{
        if(this.method.value === 'delivery'){
          return !(validation[0] === 'VALID' && validation[1] === 'VALID' && ( validation[2].calculated?.price >= 0 || validation[2].calculated?.price === 'too_far'))
        }
        else if(this.method.value === 'pickup'){
          return !(validation[0] === 'VALID' && validation[1] === 'VALID')
        }
        else return true
      }),
      tap((validation)=>{
        console.log("validation",validation);
      })
    )

  }

  ngAfterViewInit(){
  }

  getStatusResponse(currentOrder:any){
    switch (currentOrder.status) {
      case Status.Pending:
      case Status.Preparing :
        return 'Preparing your Order'
      case Status.OrderReady:
        return currentOrder.paymentMethod === 'delivery' ? 'Your Order is ready for Delivery!' : 'Your Order is ready now ready to be Picked Up!'
      case Status.OnDelivery:
        return 'Your Order is picked up and on your way!'
      default:
        return 'Error'
    }
  }

  async getCurrentLocation(){
    if(this.platform.is('hybrid')){
      const perm = await Geolocation.requestPermissions()
      if(perm.location === 'granted'){
        const position = await Geolocation.getCurrentPosition()
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        this.currentAddress$.next({
          completeAddress: (await this.geocoder.geocode({location:center})).results[0].formatted_address,
          coordinates    : center
        })

        const foundCached = this.cachedDistanceArray.find((cached)=>cached.coordinates.lat === center.lat && cached.coordinates.lng === center.lng)
        if(foundCached){
          this.fetchedDistance$.next(foundCached.distance)
        }
        else{
          this.fetchedDistance$.next('calculating')
          try{
            const distance = await this.getDistance(this.storeCoordinates, center)
            this.cachedDistanceArray.push({
              coordinates : center,
              distance    : distance
            })
            this.fetchedDistance$.next(distance)
          }
          catch(err){
            console.log("ERROR", err);
            this.fetchedDistance$.next('error')
          }
        }
      }
      else this.fetchedDistance$.next('error')
    }
    else{
      navigator.geolocation.getCurrentPosition(async (position)=>{
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        // this.currentAddress$.next(null)
        this.currentAddress$.next({
          completeAddress: (await this.geocoder.geocode({location:center})).results[0].formatted_address,
          coordinates    : center
        })

        const foundCached = this.cachedDistanceArray.find((cached)=>cached.coordinates.lat === center.lat && cached.coordinates.lng === center.lng)
        if(foundCached){
          this.fetchedDistance$.next(foundCached.distance)
        }
        else{
          this.fetchedDistance$.next('calculating')
          try{
            const distance = await this.getDistance(this.storeCoordinates, center)
            this.cachedDistanceArray.push({
              coordinates : center,
              distance    : distance
            })
            this.fetchedDistance$.next(distance)
          }
          catch(err){
            console.log("ERROR", err);
            this.fetchedDistance$.next('error')
          }
        }
      },(err)=>{
        console.log("ERROR", err);
        this.fetchedDistance$.next('error')
      })
    }
  }

  paymentData(currentOrder:any, withVoucher:boolean){
    const price = currentOrder.items.reduce((prev:number,curr:any)=>{
      if(curr.variants){
        return curr.variants.reduce((varPrev:number,varCurr:any)=>{
          return (varCurr.bulk_price ?? (varCurr.price * varCurr.quantity)) + varPrev
        },0) + prev
      }
      else return (curr.bulk_price ?? (curr.price * curr.quantity)) + prev
    },0)
    if(currentOrder.voucherInfo && withVoucher){
      const voucherInfo = currentOrder.voucherInfo
      if(voucherInfo.voucherDiscountType === 'flat'){
        const discountedPrice = price - voucherInfo.voucherDiscountValue
        if(discountedPrice < 0) return 0
        else return discountedPrice
      }
      else if(voucherInfo.voucherDiscountType === 'percentage'){
        const discountedPrice = price - ( price * voucherInfo.voucherDiscountValue / 100 )
        return discountedPrice
      }
    }
    else return price
  }


  async quantityOperation(operation: 1 | -1, currentOrder:any, itemIndex: number, varInd?:number){
    const clonedOrder = structuredClone(currentOrder)
    if(varInd!==undefined){
      const quantity = clonedOrder.items[itemIndex].variants[varInd].quantity + operation
      if(quantity > 0){
        clonedOrder.items.forEach((item:any)=>{
          delete item.productDetails
        })
        clonedOrder.items[itemIndex].variants[varInd].quantity = quantity
        this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
      }
      else{
        const alert = await this.alertController.create({
          header: "Are you sure?",
          message: `This will remove the item from your cart`,
          buttons:[
            {
              text:"Cancel",
              role:'cancel'
            },
            {
              text:"Okay",
              role:'ok'

            }]
        })
        alert.present();

        if((await alert.onWillDismiss()).role === 'ok'){
          clonedOrder.items[itemIndex].variants.splice(varInd,1)

          if(clonedOrder.items[itemIndex].variants.length === 0){
            clonedOrder.items.splice(itemIndex,1)
            if(clonedOrder.items.length === 0){
              this.dataQueries.deleteOrder(clonedOrder.id)
            }
            else{
              this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
            }
          }
          else{
            this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
          }
          console.log("currorder",clonedOrder);
        }
      }
    }
    else{
      const quantity = clonedOrder.items[itemIndex].quantity + operation

      if(quantity > 0){
        clonedOrder.items[itemIndex].quantity = quantity
        delete clonedOrder.items[itemIndex].productDetails
        console.log("currOrder",clonedOrder.items);
        this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
      }
      else{
        const alert = await this.alertController.create({
          header: "Are you sure?",
          message: `This will remove the item from your cart`,
          buttons:[
            {
              text:"Cancel",
              role:'cancel'},
            {
              text:"Okay",
              role:'ok'

            }]
        })
        alert.present();

        if((await alert.onWillDismiss()).role === 'ok'){
          clonedOrder.items.splice(itemIndex,1)
          if(clonedOrder.items.length === 0){
            this.dataQueries.deleteOrder(clonedOrder.id)
          }
          else{
            this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
          }
          console.log("currorder",clonedOrder);
        }
      }
    }

  }

  disableAddButtons(currentOrder:any, itemIndex: number, varInd?:number){
    const currentItem           = currentOrder.items[itemIndex]
    if(varInd!==undefined){
      const variant               = currentItem.variants[varInd]
      const productDetailsVariant = currentItem.productDetails.variants[variant.variantIndex]
      return variant.quantity    >= productDetailsVariant.in_stock
    }
    else{
      return currentItem.quantity >= currentItem.productDetails.in_stock
    }
  }


  async proceedToCheckOut(currentOrder: any,addressArray:any){

    const checkOutDetails:any = {
      clientDeliveryDate  : this.deliveryDateType.value === 'set_date'
                              ? new Date(this.deliveryDate.value!).getTime()
                              : new Date(this.dateToday).getTime(),
      method              : this.method.value,
      itemTotal           : this.paymentData(currentOrder, false),
      totalPayment        : this.paymentData(currentOrder, true),
      specialInstructions : this.specialInstructions.value
    }

    if(this.method.value === 'delivery'){
      checkOutDetails.deliveryFeeDetails = JSON.stringify(await firstValueFrom(this.calculatedPriceDistance$))
      checkOutDetails.address            = JSON.stringify(this.addressSelection.value < 0 ? await firstValueFrom(this.currentAddress$) : addressArray[this.addressSelection.value])
    }

    if(await this.modalController.getTop()){
      this.modalController.dismiss()
    }
    this.router.navigate(['/checkout'],{
      queryParams:{
        ...checkOutDetails
      },
      skipLocationChange:true,
    })
  }





  // async placeOrder(addressArray: any, currentOrder:any){
  //   const clientDeliveryDate =  this.deliveryDateType.value === 'set_date'
  //   ? new Date(this.deliveryDate.value!).getTime()
  //   : new Date(this.dateToday).getTime()
  //   const address = this.addressSelection.value < 0 ? await firstValueFrom(this.currentAddress$) : addressArray[this.addressSelection.value]
  //   const deliveryFeeDetails = await firstValueFrom(this.calculatedPriceDistance$)
  //   this.dataQueries.placeOrder(currentOrder.id,address,this.method.value!, clientDeliveryDate,deliveryFeeDetails)
  //   this.pushNotif.sendMessage(currentOrder.storeInfo.pushNotifKey,currentOrder.id)
  // }

  // async placeOrderQuotation(addressArray: any, currentOrder:any){


  //   console.log("addressArray",addressArray);
  //   console.log("currentOrder",currentOrder);


  //   const clientDeliveryDate =  this.deliveryDateType.value === 'set_date'
  //                                 ? new Date(this.deliveryDate.value!).getTime()
  //                                 : new Date(this.dateToday).getTime()

  //   const deliveryFeeDetails = await firstValueFrom(this.calculatedPriceDistance$)
  //   const address = this.addressSelection.value < 0 ? await firstValueFrom(this.currentAddress$) : addressArray[this.addressSelection.value]
  //   this.dataQueries.placeOrder(currentOrder.id,address,this.method.value!, clientDeliveryDate,deliveryFeeDetails)
  //   this.pushNotif.sendMessage(currentOrder.storeInfo.pushNotifKey,currentOrder.id)

  // }

  async addAddress(addressLength: number){
    const modal = await this.modalController.create({
      component: AddAddressComponent,
      componentProps:{
        addressLength: addressLength
      }
    })
    modal.present()
  }

  async cancelOrder(orderId: string){
    console.log(orderId);

    const alert = await this.alertController.create({
      header: "Are you sure?",
      message: "This will cancel your order",
      buttons: [
        {
          text: "OK",
          handler: async()=>{
            this.dataQueries.cancelOrder(orderId)
          }
        },
        "Cancel"
      ]
    })
    alert.present()
  }

  get purchaseTypeVar(){
    return this.purchase_type.value
  }

  requestQuotation(orderId:string){
    console.log("orderID", orderId);

    let message = null

    if(this.chatMessageInput.value){
      message = {
        message   : this.chatMessageInput.value,
        timestamp : new Date().getTime(),
        read      : false,
        from      :'client'
      }
    }

    this.dataQueries.forQuotation(orderId, message)
    this.chatMessageInput.reset()
  }

  sendQuotationMessage(orderID:string, chatArr:any[]){
    if(this.chatMessageInput.value){
      if(chatArr){
        chatArr.push({
          from      : 'client',
          message   : this.chatMessageInput.value,
          timestamp : new Date().getTime(),
          read      : false
        })
      }
      else{
        chatArr = []
        chatArr.push({
          from      : 'client',
          message   : this.chatMessageInput.value,
          timestamp : new Date().getTime(),
          read      : false
        })
      }


      this.dataQueries.sendOfferedQuotation(orderID,chatArr)
      this.chatMessageInput.reset()
    }
  }

  async declineOffer(orderID: string, messages: any[]){
    const alert = await this.alertController.create({
      header: "Please tell us why you declined our offer.",
      inputs:[{
        type: 'textarea',
        placeholder: "Your reason..."
      }],
      buttons:[
        "Cancel",
        {
          text: "OK",
          handler:async(inputData)=>{
            const readMessage = structuredClone(messages)
            readMessage.push({
               from            : 'client',
               message         : `Declined you offer with the reason: ${inputData[0]}`,
               read            :  false,
               timestamp       :  new Date().getTime(),
               invisibleClient :  true
            })

            this.dataQueries.declineOffer(orderID,readMessage)
            console.log("messages",readMessage,messages);
            console.log("orderId", orderID);

          }
        }
      ]
    })

    alert.present()

  }

  cancelPaymentDetails(){
    this.openPaymentComponent = false
    this.method.reset()
    this.deliveryDateType.reset()
  }

  sendChat(orderId:string,chat:any[]){
    if(this.chatInput.value){
      if(chat){
        chat.push({
          from      : 'client',
          message   : this.chatInput.value,
          timestamp : new Date().getTime(),
          read      : false
        })
      }
      else{
        chat = []
        chat.push({
          from      : 'client',
          message   : this.chatInput.value,
          timestamp : new Date().getTime(),
          read      : false
        })
      }

      this.dataQueries.sendChat(orderId,chat)
      this.chatInput.reset()
    }
  }

  applyVoucher(orderId:string, storeId:string){
    this.dataQueries.applyVoucher(orderId, storeId,this.voucherSelection.value!)
  }


  async distanceCalculation(coord:any){
    const foundCached = this.cachedDistanceArray.find((cached)=>cached.coordinates.lat === coord.lat && cached.coordinates.lng === coord.lng)
      if(foundCached){
        this.fetchedDistance$.next(foundCached.distance)
      }
      else{
        this.fetchedDistance$.next('calculating')
        try{
          const distance = (await this.getDistance(this.storeCoordinates, coord))
          this.cachedDistanceArray.push({
            coordinates : coord,
            distance    : distance
          })
          this.fetchedDistance$.next(distance)
        }
        catch(err){
          console.log("ERROR", err);
          this.fetchedDistance$.next('error')
        }
      }
  }


  async getDistance(origin:any, dest:any){
    return(await firstValueFrom(bindCallback(this.distanceService.getDistanceMatrix)({
      origins: [origin],
      destinations: [dest],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    })))[0]?.rows[0].elements[0]
  }



  // initConfig(){
  //   this.payPalConfig = {
  //       currency: 'EUR',
  //       clientId: 'sb',
  //       createOrderOnClient: (data:any) => < ICreateOrderRequest > {
  //           intent: 'CAPTURE',
  //           purchase_units: [{
  //               amount: {
  //                   currency_code: 'EUR',
  //                   value: '9.99',
  //                   breakdown: {
  //                       item_total: {
  //                           currency_code: 'EUR',
  //                           value: '9.99'
  //                       }
  //                   }
  //               },
  //               items: [{
  //                   name: 'Enterprise Subscription',
  //                   quantity: '1',
  //                   category: 'DIGITAL_GOODS',
  //                   unit_amount: {
  //                       currency_code: 'EUR',
  //                       value: '9.99',
  //                   },
  //               }]
  //           }]
  //       },
  //       advanced: {
  //           commit: 'true'
  //       },
  //       style: {
  //           label: 'paypal',
  //           layout: 'vertical'
  //       },
  //       onApprove: (data:any, actions:any) => {
  //           console.log('onApprove - transaction was approved, but not authorized', data, actions);
  //           actions.order.get().then(details => {
  //               console.log('onApprove - you can get full order details inside onApprove: ', details);
  //           });

  //       },
  //       onClientAuthorization: (data:any) => {
  //           console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
  //           this.showSuccess = true;
  //       },
  //       onCancel: (data:any, actions:any) => {
  //           console.log('OnCancel', data, actions);
  //           this.showCancel = true;

  //       },
  //       onError: (err:any) => {
  //           console.log('OnError', err);
  //           // this.showError = true;
  //       },
  //       onClick: (data, actions) => {
  //           console.log('onClick', data, actions);
  //           this.resetStatus();
  //       }
  //     };
  //   }

  cancelQuotation(currentOrder:any){
    this.dataQueries.cancelQuotation(currentOrder)
  }
}
