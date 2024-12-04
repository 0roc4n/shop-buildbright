import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, Form, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { Database, child, get, onValue, push, ref, remove, set, update } from '@angular/fire/database';
import { AlertController, ModalController } from '@ionic/angular';
import { PaypalComponent } from 'src/app/components/modals/paypal/paypal.component';
import { PurchaseDoneComponent } from 'src/app/components/modals/purchase-done/purchase-done.component';
import { Subscription } from 'rxjs';
import { Status } from 'src/app/interfaces/status';
import { PushNotifService } from 'src/app/services/push-notif.service';


@Component({
  selector: 'app-check-out',
  templateUrl: './check-out.page.html',
  styleUrls: ['./check-out.page.scss'],
})

export class CheckOutPage implements OnInit{

  selectedProducts: any[] = [];
  product: any[] = [];
  userDataString = JSON.parse(localStorage.getItem('userData')!);
  address : any[] = this.userDataString.address
  selectedAddress:any = this.address[0].completeAddress
  selectedVoucher:any = null;
  changeAdd = false
  openVouchers = false
  openPayPal = false
  userCoords:any = this.address[0].coordinates
  totalCharge:any
  paymentMeth = 'cash'
  today = this.getRealTime();

  deliveryDateValue = 'same_day'
  deliveryAdd :{} = this.address[0]
  createDate = new Date().toISOString().split('T')[0];
  deliveryFee:number = 0
  vouchers$ = this.dataquery.getAvailableVouchers();
  voucherSelection = ''
  cartId:any[] = []
  shopDatas = JSON.parse(localStorage.getItem('shopId')!)
  storeCoords:any = this.shopDatas.branches[0].coordinates
  shopId = this.shopDatas.id;
  getPricePerDist = ref(this.db, `/pricePerDistance/${this.shopDatas.id}`);
  ppd:any
  totalDeliveryFee:any
  reachedMaxDistance = false;
  deliveryMethod = 'delivery';
  hasVouchers = false;
  confirmedDate = false;
  datetime:string = this.today;


  constructor(private route: ActivatedRoute,
              private dataquery: DataqueriesService,
              private fb : FormBuilder,
              private db : Database,
              private alert : AlertController,
              private modalController : ModalController,
              private router : Router,
              private notifService: PushNotifService,
              private alertController : AlertController) { 
                // this.minDate = new Date().toISOString();
              } 


  
  bulk:string|null = null;
  ngOnInit() {
    this.bulk = this.route.snapshot.paramMap.get('bulk');
    const obs =  this.vouchers$.subscribe(data=>{
      if(data.length){
        this.hasVouchers = true;
      }
      console.log('VOUCHERS',data)
      obs.unsubscribe();
    })
    console.log(this.shopDatas);
    this.dataquery.selectedProducts$.subscribe((products) => {
      this.selectedProducts = products;
    });


    console.log(this.selectedProducts)

    if(this.selectedProducts.length>0){
      for(const cartId of this.selectedProducts){
        if(cartId.cartId){
          this.cartId.push(cartId.cartId)
        } else {
          this.cartId.length = 0
        }
      }
  
      for (const prod of this.selectedProducts) {

        if (prod.variants && prod.variants.length > 0) {
          const variantFormGroups = prod.variants.map((variant:any) => this.fb.group({
            variant:variant.variant,
            variantIndex: variant.variantIndex,
            variation: variant.variation
          }));
        
          const productFormGroup = this.fb.group({
            productId: prod.productId,
            name: prod.name,
            price: prod.price,
            quantity: prod.quantity,
            image: prod.images ?? prod.image,
            bulk_price: prod.bulk_price?? null,
            // variantIndex: -1,
            variants: this.fb.array(variantFormGroups)
          });      
          (this.orderForm.get('products') as FormArray).push(productFormGroup);
        } else {
          const productFormGroup = this.fb.group({
            productId: prod.productId,
            name: prod.name,
            price: prod.price,
            quantity: prod.quantity,
            image: prod.images ?? prod.image,
            bulk_price: prod.bulk_price?? null,
          });
          (this.orderForm.get('products') as FormArray).push(productFormGroup);
        }
      }
      
    }

    onValue(this.getPricePerDist, (snapshot) => {
      const ppd = snapshot.val();

      this.ppd = ppd
    });

    this.orderForm.get('clientId')!.patchValue(this.userDataString.id);
    // this.orderForm.get('pushNotifKey')!.patchValue(this.userDataString.pushNotifKey);
    // this.orderForm.get('orderCreated')!.patchValue(new Date().getTime());
    this.orderForm.get('timestamp')!.patchValue(new Date().getTime());
  }

  orderForm: FormGroup = this.fb.group({
    clientId: ['', [Validators.required, this.nonNullableValidator]],
    // orderCreated: ['', [Validators.required, this.nonNullableValidator]],
    timestamp: ['', [Validators.required, this.nonNullableValidator]],
    address: [this.deliveryAdd, [Validators.required, this.nonNullableValidator]],
    products: this.fb.array([], [Validators.required, this.nonNullableValidator]),
    deliveryDate: [this.today, [Validators.required, this.nonNullableValidator]],
    deliveryMethod: [this.deliveryMethod,  [Validators.required, this.nonNullableValidator]],
    paymentMethod: [this.paymentMeth, [Validators.required, this.nonNullableValidator]],
    message: ['', [Validators.maxLength(100)]],
    totalPrice: ['', [Validators.required, this.nonNullableValidator]],
    voucherDiscount: [0],
    voucherInfo: [''],
    deliveryFee: ['', [Validators.required, this.nonNullableValidator]],
    status: [1, [Validators.required, this.nonNullableValidator]],
    // pushNotifKey: [null],
    storeId: [''],
  });
  
  nonNullableValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    const arrayValue = control.value;
  
    if (value === null || value === undefined || value === '') {
      return { 'nonNullable': true };
    }

    if (!arrayValue || arrayValue.length === 0) {
      return { 'nonNullableArray': true };
    }
  
    return null;
  }
  


  capitalize(str: any): string {
    if (typeof str !== 'string') {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onAddressChange(value:any) {
    this.selectedAddress = value.completeAddress;
    this.deliveryAdd = {
      completeAddress : value.completeAddress,
      coordinates : value.coordinates
    }

    this.orderForm.get('address')!.patchValue(this.deliveryAdd);

    const coor = this.address.filter((coords: any) => coords.completeAddress === this.selectedAddress);
    
    if (coor.length > 0) {
      const matchedCoordinates = coor[0];
      this.userCoords = matchedCoordinates.coordinates
    } else {
        console.log("No matching coordinates found.");
    }

    this.changeAdd = !this.changeAdd
  }

  getSubtotalPrice() {
    let subtotalPrice: number = 0;
  
    this.selectedProducts.forEach(product => {
      const price = product.bulk_price ?? (product.price * product.quantity);
  
      if (!isNaN(price)) {
        subtotalPrice += price;
      }
    });

    return subtotalPrice;
  }

  perItemFromBulk(product:any){
    return (product.bulk_price / product.quantity).toFixed(2);
  }

  selectVoucher(event:any){
    // console.log('selects vouce')
    this.selectedVoucher = event.target.value
  }

  removeVoucher() {
    // this.voucherSelection = ''
    this.selectedVoucher = null;
    this.orderForm.get('voucherInfo')!.setValue('');
    this.orderForm.get('voucherDiscount')!.setValue(0); 
  }

  getVoucherAmount(){
    var toDeduct = 0
    if(this.selectedVoucher != null){
      const subtotal = this.getSubtotalPrice();
      if(this.selectedVoucher.voucherDiscountType === 'flat'){
        toDeduct = this.selectedVoucher.voucherDiscountValue
      }
      else if(this.selectedVoucher.voucherDiscountType === 'percentage'){
        toDeduct = ( subtotal * this.selectedVoucher.voucherDiscountValue / 100 )
      }
    }
    
    this.orderForm.get('voucherInfo')!.setValue(this.selectedVoucher);
    this.orderForm.get('voucherDiscount')!.setValue(toDeduct); 

    return toDeduct;
  }

  getDistance(){
    const earthRadius = 6371000; // Earth's radius in meters

    const lat1 = this.storeCoords.lat;
    const lon1 = this.storeCoords.lng;

    const lat2 = this.userCoords.lat;
    const lon2 = this.userCoords.lng;

    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = Math.round(earthRadius * c); // Distance in meters, rounded off

    return distance.toString(); // Return the rounded distance as a string
  }

  getPricePerDistance() {
    let distancePrice:number=0;
    const distanceMeasured = this.getDistance();

    let reachedMaxDistance = false;
    if (this.ppd) {
        for (const key in this.ppd) {
          if (this.ppd.hasOwnProperty(key)) {
            const val = this.ppd[key];
            const minDistance = val.minDistance || 0; 
            const maxDistance = val.distance;
            // Check if distanceMeasured is within the interval [minDistance, maxDistance]
            if (distanceMeasured >= minDistance && distanceMeasured <= maxDistance) {
                distancePrice = val.price;
                reachedMaxDistance = false;
                break;
              } else if (distanceMeasured > maxDistance) {
                reachedMaxDistance = true;
                console.log(reachedMaxDistance)
              }
          }
        }
        // if (reachedMaxDistance) {
        //   // Show an alert if the distance exceeds the maximum with 'too_far' price
        //   alert("Delivery not possible for this location.");
        // }
      }
      this.reachedMaxDistance = reachedMaxDistance;
      this.totalDeliveryFee = distancePrice
      this.orderForm.get('deliveryFee')!.patchValue(this.totalDeliveryFee);
    return distancePrice;
  }

  getTotalPrice(){
    const subtotal = this.getSubtotalPrice();
    const deliveryCharge = this.getPricePerDistance();
    const voucherDiscount = this.getVoucherAmount()
    this.totalCharge = (((subtotal - voucherDiscount )>0)? subtotal - voucherDiscount: 0) +( (this.deliveryMethod=='delivery')?  deliveryCharge:0)
    this.orderForm.get('totalPrice')!.patchValue(this.totalCharge);    
    return this.totalCharge
  }
  
  async proceedToPayment(){
    console.log(this.paymentMeth);
    if(this.paymentMeth == 'paypal'){
      const totalCharge = this.dataquery.goToPayment(this.totalCharge);
  
    const modal = await this.modalController.create({
      component: PaypalComponent,
      componentProps: {
        totalCharge: totalCharge,
      },
    });
    modal.onWillDismiss().then((transaction)=>{
      if(transaction.data != 'closed'){
        const paypal = transaction.data;
        this.orderForm.addControl('paypalData',this.fb.group({
          transactionID: [paypal.id],
          payer:  [(paypal.payer.name.given_name || paypal.payer.name.surname)? `${paypal.payer.name.given_name} ${paypal.payer.name.surname}`.trim(): null],
          payerID: [paypal.payer.payer_id],
          email: [paypal.payer.email_address]
        }))
      }
      this.sendOrder();
    })
    modal.present();
    }else{
      this.sendOrder();
    }
  }

  async sendOrder() {
    const sendOrderRef = ref(this.db, '/orders');
    this.orderForm.get('storeId')!.patchValue(this.shopId);
    const readableDate = new Date(this.orderForm.get('deliveryDate')?.value).toLocaleDateString('en-us', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });  
    this.orderForm.get('deliveryDate')!.patchValue(readableDate);
    // this.orderForm.get('orderCreated')!.patchValue(new Date().getTime());
    this.orderForm.get('timestamp')!.patchValue(new Date().getTime());
    console.log('BULK',this.bulk)
    if(this.bulk){
      const bulkOrderRef = ref(this.db, `/orders/${this.bulk}`);
      update(bulkOrderRef,this.orderForm.value);
      const quotationStatusRef = ref(this.db, `/orders/${this.bulk}/quotation`)
      update(quotationStatusRef,{
        status:Status.Resolved
      });
      if(this.shopDatas.pushNotifKey != null &&  this.bulk!=null){
        this.notifService.sendMessage(this.shopDatas.pushNotifKey, this.bulk);
      }
    }else{
      const reference =  push(sendOrderRef,this.orderForm.value);
      if(this.shopDatas.pushNotifKey != null &&  reference.key!=null){
        this.notifService.sendMessage(this.shopDatas.pushNotifKey, reference.key);
      }
    }

    if(this.cartId.length>0){
      const cartsRef = ref(this.db, `/cart/${this.userDataString.id}`);
      this.cartId.forEach((cartId: string) => {
        const cartItemRef = child(cartsRef, cartId);
        remove(cartItemRef);
      });
    }

    

    // for(const prod of this.selectedProducts){
    //   let updateRef:any
    //   const pro = prod.productId
    //   if(prod.variants){
    //     var productRef = ref(this.db, `/products/${this.shopDatas.id}/${pro}/variants`)
    //     if(prod.variants[0].variation == 'colors'){
    //       productRef = ref(this.db, `/products/${this.shopDatas.id}/${pro}/variants/colors/${prod.variants[0].variantIndex}/types/${prod.variants[1].variantIndex}/in_stock`)
    //     }else if(prod.variants[0].variation == 'color'){
    //       productRef = ref(this.db, `/products/${this.shopDatas.id}/${pro}/variants/color/${prod.variants[0].variantIndex}/in_stock`)
    //     }else if(prod.variants[0].variation == 'size'){
    //       productRef = ref(this.db, `/products/${this.shopDatas.id}/${pro}/variants/size/${prod.variants[0].variantIndex}/in_stock`)
    //     }
    //     get(productRef).then(snapshot => {
    //       const currentStock = snapshot.val();
    //       const newStock = currentStock - prod.quantity;

    //       set(productRef, newStock).then(() => {
    //         console.log('Value updated successfully');
    //       }).catch(error => {
    //         console.error('Error updating value:', error);
    //       });
        
    //     }).catch(error => {
    //       console.error('Error getting current value:', error);
    //     });

     
    //   } else {
    //     const productRef = ref(this.db, `/products/${this.shopDatas.id}/${pro}/in_stock`)

    //     get(productRef).then(snapshot => {
    //       const currentStock = snapshot.val();

    //       const newStock = currentStock - prod.quantity;

    //       set(productRef, newStock).then(() => {
    //         console.log('Value updated successfully');
    //       }).catch(error => {
    //         console.error('Error updating value:', error);
    //       });
        
    //     }).catch(error => {
    //       console.error('Error getting current value:', error);
    //     });

    //   }
      
    // }
    const modal = await this.modalController.create({
      component: PurchaseDoneComponent, 
    });
    
    await modal.present();
  }

  getRealTime(){
    // var tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    return new Date(Date.now()).toISOString();
  }

  date:string = this.getRealTime();
  minDate = this.today;

  updateDateValue(){
    this.date = this.orderForm.get('deliveryDate')?.value;

    this.confirmedDate = true;
  }

  rePickDate(){
    this.confirmedDate = false;
  }

  updateDeliveryDate(event: any) {
    this.deliveryDateValue = event.target.value;

    if (event.target.value === 'same_day') {
      // this.orderForm.get('deliveryDate')?.patchValue(this.date)
      this.orderForm.get('deliveryDate')!.patchValue(this.today);
    }
    
  }

  parseDate(dt:string){
    return new Date(dt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  updatePaymentMethod(event: any) {
    this.paymentMeth = event.target.value;


    this.orderForm.get('paymentMethod')!.patchValue(this.paymentMeth);

  }

  updateDeliveryMethod(event: any) {
    this.deliveryMethod = event.target.value;
    this.orderForm.get('deliveryMethod')!.patchValue(this.deliveryMethod);
  }

  

  goToShop(){
    this.selectedProducts.length = 0
    this.product.length = 0
    this.router.navigate(['/view-cart']);
  }
  
  
}

function deg2rad(deg:any) {
  return deg * (Math.PI / 180);
}
