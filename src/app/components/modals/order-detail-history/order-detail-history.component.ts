import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Database } from '@angular/fire/database';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GoogleMap, GoogleMapsModule, MapDirectionsService } from '@angular/google-maps';
import { Camera, CameraResultType, CameraSource, GalleryImageOptions, ImageOptions } from '@capacitor/camera';
import { ActionSheetController, AlertController, IonicModule, LoadingController, ModalController } from '@ionic/angular';
import { onValue, query, ref } from 'firebase/database';
import { statSync } from 'fs';
import { BehaviorSubject, Subject, firstValueFrom, map, takeUntil, tap } from 'rxjs';
import { Status } from 'src/app/interfaces/status';
import { DataStorageService } from 'src/app/services/data-storage.service';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { GoogleMapPinsService } from 'src/app/services/google-map-pins.service';

@Component({
  selector: 'app-order-detail-history',
  templateUrl: './order-detail-history.component.html',
  styleUrls: ['./order-detail-history.component.scss'],
  standalone: true,
  imports:[CommonModule, IonicModule, GoogleMapsModule, ReactiveFormsModule]
})
export class OrderDetailHistoryComponent  implements OnInit , OnDestroy, AfterViewInit{
  @ViewChild('mapRef')mapRef!: GoogleMap;

  unsubscibe$ = new Subject<void>()

  orderDetail!:any

  total!:any

  statEnum = Status;

  mapOptions:google.maps.MapOptions = {
    disableDefaultUI: true,
    clickableIcons: false,
    keyboardShortcuts: false,
  }

  returnToggleButton = false

  returnArray:any[] = []

  cameraOptions:ImageOptions={
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera
  }

  galleryOptions:GalleryImageOptions={
    correctOrientation:true,
    limit : 1
  }

  returnProduct$ = new BehaviorSubject<any>(false)

  returnMessageInput =  this.fb.control('',{
    validators: Validators.required
  })

  chatInput = this.fb.control('')

  voucherDetails?:any

  constructor(private modalController       : ModalController,
              private dataQueries           : DataqueriesService,
              public  googleMapPins         : GoogleMapPinsService,
              private actionSheetController : ActionSheetController,
              private alertController       : AlertController,
              private dataStorage           : DataStorageService,
              private loadingController     : LoadingController,
              private fb                    : FormBuilder,
              private db: Database, 
              private cdr: ChangeDetectorRef,
              private  directionsService: MapDirectionsService
              ) { }


  ngAfterViewInit(): void {
    const bounds = new google.maps.LatLngBounds();
    const markers:any = [];
    // markers.push(this.orderDetail.storeDetails.branches[0].coordinates);
    markers.push(this.orderDetail.address.coordinates);
    var polyline:any = null;
    if(this.orderDetail.riderId!=null && this.orderDetail.status == Status.OnDelivery){
      onValue(query(ref(this.db,`/rtLocation/${this.orderDetail.riderId}`)), (snapshot) => {
        this.dataQueries.getRiderLocation(this.orderDetail.riderId).subscribe((r:any)=>{
          this.orderDetail.riderLoc ={
            coordinates: {
              lat: r.coords.latitude,
              lng:r.coords.longitude ,
            }
          };
          markers[1] = this.orderDetail.riderLoc.coordinates;


          print
          let request = {
            origin: markers[1],
            destination: markers[0],
            travelMode : google.maps.TravelMode.DRIVING
          }
          this.directionsService.route(request).subscribe(data=>{
           if(data.status == 'OK'){
            polyline?.setMap(null);
            polyline = new google.maps.Polyline({
              path: data.result?.routes[0].overview_path,
              strokeColor: '#0000FF',
              strokeOpacity: 0.5,
              strokeWeight: 6
            });
            polyline.setMap(this.mapRef.googleMap!);
           }
          })
          if(bounds.isEmpty()){
            bounds.extend(this.orderDetail.storeDetails.branches[0].coordinates)
            bounds.extend(this.orderDetail.address.coordinates)
            bounds.extend(this.orderDetail.riderLoc.coordinates);
            if(this.orderDetail.deliveryAddress)bounds.extend(this.orderDetail.deliveryAddress.coordinates)
            this.mapRef?.fitBounds(bounds)
          }
       
        })
      });
    }

    this.cdr.detectChanges();
  }

  

  async ngOnInit() {
    // const itemDetails = await Promise.all(this.orderDetail.products.map(
    //   (item: any)=> firstValueFrom(this.dataQueries.getProductById(item.productId, this.orderDetail.shopId))
    // ))
    // this.orderDetail.products.map((item:any, index: number)=>{
    //   item.productDetails = itemDetails[index]
    // })
    


    console.log("this.orderDetail",this.orderDetail);
    console.log("voucherDetails", this.voucherDetails);

    

    this.total = this.paymentData(this.orderDetail)
    // No field called 'items' in orderdetails
    // 'items' => 'products
    // this.total = this.orderDetail.products.reduce((prev:number,curr:any)=>{
    //   if(curr.variants){
    //     return curr.variants.reduce((varPrev:number,varCurr:any)=>{
    //       return varCurr.price * varCurr.quantity + varPrev
    //     },0) + prev
    //   }
    //   else return curr.quantity * curr.price + prev
    // },0)


    this.getReturnProducts()

    // this.returnProduct$.pipe(
    //   tap((data)=>{
    //     console.log("returnData", data );

    //   })
    // ).subscribe()

  }

  getReturnProducts(){
    this.dataQueries.getReturnProd(this.orderDetail.id, this.orderDetail.storeId).pipe(

      map((returnProduct: any)=>{
        if(returnProduct){
          returnProduct.products = returnProduct.products.map((product:any)=>{
            return {
              ...product,
              // No field called 'items' in orderdetails
              // 'items' => 'products', (fix)
              // productDetails:this.orderDetail.products.find((orderDetailProd:any)=>orderDetailProd.productId === product.productId).productDetails
              ...this.orderDetail.products.find((orderDetailProd:any)=> orderDetailProd.productId === product.productId)
            }
          })
          return returnProduct
        }
        else return 'no_return'
      }),
      tap((returnData:any)=>{
        this.returnProduct$.next(returnData)
      }),
      takeUntil(this.unsubscibe$)
    ).subscribe(data=>{
    })
  }

  ngOnDestroy(): void {
    this.unsubscibe$.next()
  }

  dismissModal(){
    this.modalController.dismiss()
  }

  get status(){
    // Database has type of word in status instead of int.. (error)
    // must convert old entries to int, temp sol => add case
    // fix for new entries, convert status to its int value 
    switch(this.orderDetail.status){
      case Status.Declined:
      // case 'Declined':
        // this.orderDetail.status = Status.Declined;
        return "Your Order was declined"
      case Status.Canceled:
        return "Your Order was cancelled "
      case Status.Pending   :
      // case 'Pending':
        // this.orderDetail.status = Status.Pending;
        return "Your Order is being processed"
      case Status.Preparing :
        return "Preparing your Order"
      case Status.OrderReady:
      // case 'for delivery':
        // this.orderDetail.status = Status.OrderReady;
        return  this.orderDetail.deliveryMethod ==='pickup'?  "Your Order is ready to be picked up!" :  "Your Order is ready for Delivery!" 
      case Status.OnDelivery:
        return "Your Order was picked up and is on the way!"
      case Status.Resolved:
        return "Your Return Order Was Resolved"
      case Status.Delivered :
        return this.orderDetail.deliveryMethod ==='pickup'? "Your Order was picked up" : "You Order was Delivered";
      case Status.WithReview:
        return this.orderDetail.deliveryMethod ==='pickup'? "Your Order was picked up" :  "Your Order was Delivered"
      default:
        return "ERROR"
    }
  }

  async pressCancelButton(){
    if(this.returnArray.length > 0){
      const alert = await this.alertController.create({
        header:"Are you sure?",
        message: "You currently have products to return. This will delete all items to be returned.",
        buttons:["Cancel",{
          text:"Ok",
          role:"ok"
        }]
      })

      alert.present()
      const flag = await alert.onWillDismiss()
      if(flag.role === 'ok'){
        this.returnToggleButton = !this.returnToggleButton
        this.returnArray = []
      }

    }
    else   this.returnToggleButton = !this.returnToggleButton


  }

  selectReturnProduct($event:any,product:any, productId?:string, productDetails?:any, variantIndex?: number){
    if($event.detail.checked){
      var _product = product;
      _product.pictures =[];
      _product.variants = product.variants ?? null;
      // if(variantIndex === undefined){
        this.returnArray.push(
        {
          ..._product,

        }
        )
      // }
      // else{
      //   const found = this.returnArray.find((returnProduct:any)=>returnProduct.productId === productId)
      //   if(found){
      //     found.variants.push({
      //       variantIndex: variantIndex,
      //       pictures: []
      //     })
      //   }
      //   else{
      //     this.returnArray
      //       .push({
      //         productId      : productId,
      //         productDetails : productDetails,
      //         variants : [{
      //           variantIndex      : variantIndex,
      //           pictures   : []
      //         }]
      //       })
      //   }
      // }
    }
    else{
      // if(variantIndex === undefined){
        this.returnArray = this.returnArray.filter((returnProduct:any)=> returnProduct.productId !== productId)
      // }
      // else{
      //   const found = this.returnArray.findIndex((returnProduct:any)=>returnProduct.productId === productId)
      //   this.returnArray[found].variants = this.returnArray[found].variants.filter((variantIndexInArr:any)=> variantIndexInArr.variantIndex !==  variantIndex)
      //   if(this.returnArray[found].variants.length === 0 )this.returnArray.splice(found,1)
      // }
    }

    console.log("ARRAY",this.returnArray);

  }

  get disableReturnButton(){
    // return this.returnArray.some((returnProduct:any)=> returnProduct.variants ? returnProduct.variants.some((variant:any)=> variant.pictures.length === 0) : returnProduct.pictures.length === 0)
    return this.returnArray.some((returnProduct:any)=>returnProduct.pictures.length === 0);
  }


  async getPicture(returnProductIndex:number, returnVariantIndex?:number){
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
        if(result){
          if(returnVariantIndex === undefined){
            this.returnArray[returnProductIndex].pictures.push(result.webPath)
          }
          else{
            this.returnArray[returnProductIndex].variants[returnVariantIndex].pictures.push(result.webPath)
          }
        }
      }
      catch(err){
        console.log("ERR",err);
      }
    }
    else if(selection.role === 'gallery') {
      try{
        const result = await this.fromGallery()
        if(returnVariantIndex === undefined){
          this.returnArray[returnProductIndex].pictures.push(...result!)// = [...this.returnArray[returnProductIndex].pictures, ]
        }
        else{
          this.returnArray[returnProductIndex].variants[returnVariantIndex].pictures.push(...result!)
        }

        // this.registrationForm.get('profilePic')?.patchValue(result?.webPath)
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
    const image = (await Camera.pickImages(this.galleryOptions)).photos
    return image.map(im=>im.webPath)
    }
    catch(err){
      console.log("ERR",err);
      return null
    }
  }

  async requestReturn(){
    try{
      const loading = await this.loadingController.create({
        message: "Uploading..."
      })

      loading.present()
      const iamgeRefs = await this.dataStorage.uploadReturnPhotos(this.orderDetail.id,this.orderDetail.storeId,this.returnArray)
      const cloneReturnArray = structuredClone(this.returnArray)
      cloneReturnArray.forEach((returnProduct:any, prodIndex:number)=>{
        delete returnProduct.productDetails
        // if(returnProduct.variants){
        //   returnProduct.variants.forEach((variant:any, varIndex:number)=>{
        //     variant.pictures = iamgeRefs[prodIndex][varIndex]
        //   })
        // }
        // else{
        returnProduct.pictures = iamgeRefs[prodIndex]
        // }
      })
      console.log('cloneReturnArray',cloneReturnArray);
      await this.dataQueries.requestReturn(this.orderDetail.id,this.orderDetail.storeId,cloneReturnArray, this.returnMessageInput.value!)
      this.orderDetail.returnProductStatus = Status.Pending

      this.returnToggleButton = !this.returnToggleButton
      loading.dismiss()
      this.returnArray = []
      this.getReturnProducts()
    }
    catch(err){

    }

  }

  chatReturnProduct(messageArray: any[]){
    if(this.chatInput.value) {
     if(messageArray){
      messageArray.push({
        from      : 'client',
        message   : this.chatInput.value,
        read      : false,
        timestamp : new Date().getTime()
      })
      this.dataQueries.chatReturnProduct(this.orderDetail.id, this.orderDetail.storeId, messageArray)
      this.chatInput.reset()
     }else{
      messageArray=[];
      messageArray.push({
        from      : 'client',
        message   : this.chatInput.value,
        read      : false,
        timestamp : new Date().getTime()
      })
      this.dataQueries.chatReturnProduct(this.orderDetail.id, this.orderDetail.storeId, messageArray)
      this.chatInput.reset()
     }
    }
  }

  chatRider(order: any){
    if(this.chatInput.value) {
      if(order.chat){
        order.chat.push({
          from      : 'client',
          message   : this.chatInput.value,
          read      : false,
          timestamp : new Date().getTime()
        })
        this.dataQueries.sendChat(this.orderDetail.id, order.chat)
        this.chatInput.reset()
      }else{
        order.chat = [];
        order.chat.push({
          from      : 'client',
          message   : this.chatInput.value,
          read      : false,
          timestamp : new Date().getTime()
        })
        this.dataQueries.sendChat(this.orderDetail.id, order.chat)
        this.chatInput.reset()
      }
    }
  }

  

  deleteImage(productIndex:number,imageIndex:number , variantArrayIndex?:  number){
    if(variantArrayIndex === undefined){
      this.returnArray[productIndex].pictures.splice(imageIndex, 1)
    }
    else{
      this.returnArray[productIndex].pictures.splice(imageIndex, 1)
    }

  }

  reopenReturn(){
    this.dataQueries.reopenReturn(this.orderDetail.id, this.orderDetail.storeId)
    this.modalController.dismiss();
  }


  // paymentData(currentOrder:any, withVoucher:boolean){
  //   // No field called 'items' in orderdetails
  //   // 'items' should be 'products'
  //   const price = currentOrder.products.reduce((prev:number,curr:any)=>{
  //     // if(curr.variants){
  //     //   return curr.variants.reduce((varPrev:number,varCurr:any)=>{
  //     //     return (varCurr.bulk_price ?? (varCurr.price * varCurr.quantity)) + varPrev
  //     //   },0) + prev
  //     // }
  //     // else 
  //     return (curr.bulk_price ?? (curr.price * curr.quantity)) + prev
  //   },0)
  //   if(this.voucherDetails && withVoucher){
  //     const voucherInfo = this.voucherDetails
  //     if(voucherInfo.voucherDiscountType === 'flat'){
  //       const discountedPrice = price - voucherInfo.voucherDiscountValue
  //       if(discountedPrice < 0) return 0
  //       else return discountedPrice
  //     }
  //     else if(voucherInfo.voucherDiscountType === 'percentage'){
  //       const discountedPrice = price - ( price * voucherInfo.voucherDiscountValue / 100 )
  //       return discountedPrice
  //     }
  //   }
  //   else return price
  // }


   paymentData(currentOrder:any){
    const price = currentOrder.products.reduce((prev:number,curr:any)=>{
      // if(curr.variants){
      //   return curr.variants.reduce((varPrev:number,varCurr:any)=>{
      //     return (varCurr.bulk_price ?? (varCurr.price * varCurr.quantity)) + varPrev
      //   },0) + prev
      // }
      // else 
      return (curr.bulk_price ?? (curr.price * curr.quantity)) + prev
    },0)
    if(currentOrder.voucherInfo){
      const voucherInfo = currentOrder.voucherInfo
      if(voucherInfo.voucherDiscountType === 'flat'){
        const discountedPrice = price - voucherInfo.voucherDiscountValue
        if(discountedPrice < 0) return 0 + (currentOrder.deliveryMethod == 'delivery' ? currentOrder.deliveryFee: 0)
        else return discountedPrice + (currentOrder.deliveryMethod == 'delivery' ? currentOrder.deliveryFee: 0)
      }
      else if(voucherInfo.voucherDiscountType === 'percentage'){
        const discountedPrice = price - ( price * voucherInfo.voucherDiscountValue / 100 )
        return discountedPrice + (currentOrder.deliveryMethod == 'delivery' ? currentOrder.deliveryFee: 0)
      }
    } 
    else return price  + (currentOrder.deliveryMethod == 'delivery' ? currentOrder.deliveryFee: 0)
  }

}
