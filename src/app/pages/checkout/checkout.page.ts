import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, ReplaySubject, combineLatest, firstValueFrom, switchMap, tap } from 'rxjs';
import { OrderService } from 'src/app/services/order.service';
import { PushNotifService } from 'src/app/services/push-notif.service';
import { ICreateOrderRequest, IPayPalConfig, IPurchaseUnit, ITransactionItem, NgxPayPalModule } from 'ngx-paypal';
import { environment } from 'src/environments/environment';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { Location } from '@angular/common';
import { LoadingController, NavController } from '@ionic/angular';
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit {

  currentOrder$ = this.orderService.currentOrder$

  method!:string
  clientDeliveryDate!:number
  address?:any
  deliveryFeeDetails?:any
  specialInstructions?:string
  authorizedLoading?:HTMLIonLoadingElement


  payPalConfig$ = new ReplaySubject<IPayPalConfig>()


  toPay!:any


  constructor(private actRoute: ActivatedRoute,
              private router: Router,
              private fb: FormBuilder ,
              private orderService: OrderService,
              private pushNotif: PushNotifService,
              private dataQueries: DataqueriesService,
              private location: Location,
              private loadingController: LoadingController,
              // private navCtrl: NavController,
              // private
              ) { }

  ngOnInit() {

    this.actRoute.queryParams.pipe(
      tap((param)=>{
        this.method = param['method'];
        this.clientDeliveryDate = parseInt(param['clientDeliveryDate'])
        this.specialInstructions = param['specialInstructions']
        if(this.method === 'delivery'){
          this.address = JSON.parse(param['address'])
          this.deliveryFeeDetails = JSON.parse(param['deliveryFeeDetails'])
        }
      }),
      switchMap((param)=>
        this.currentOrder$.pipe(
          tap((order)=>{
            if(order && order !== 'loading' ){
              this.payPalConfig$.next(this.nextConfig(order,param))
            }
          })
        )
      )
    ).subscribe()

  }

  nextConfig(order:any,params:Params):IPayPalConfig{
    let totalPayment     = this.paymentData(order, true)
    let totalItemPayment = this.paymentData(order, false)

    const items:ITransactionItem[] = order.items.map((item:any)=>{
      if(item.variants){
        return [...item.variants.map((variant:any)=>{
          const variantDetails = item.productDetails.variants[variant.variantIndex]

          if(variant.bulk_price){
            return {
              name: `${item.productDetails.name} (${variantDetails.variant_name}) ~ Bulk Order: (${variant.quantity} pcs)`,
              quantity: '1',
              unit_amount:{
                currency_code:'PHP',
                value:String(variant.bulk_price),
                }
            }
          }
          else{
            return {
                name       : `${item.productDetails.name} (${variantDetails.variant_name})`,
                quantity   : String(variant.quantity),
                unit_amount:{
                  currency_code:'PHP',
                  value:String(variantDetails.price),
                  }
                }
              }
            }
          )
        ]
      }
      else{
        if(item.bulk_price){
          return {
            name       : `${item.productDetails.name} ~ Bulk Order: (${item.quantity} pcs) `,
            quantity   : '1',
            unit_amount:{
              currency_code:'PHP',
              value: String(item.bulk_price),
            }
          }
        }
        else{
          return {
            name       : item.productDetails.name,
            quantity   : String(item.quantity),
            unit_amount:{
              currency_code:'PHP',
              value: String(item.productDetails.price),
            }
          }
        }

      }
    }).flat()

    const purchase_units:IPurchaseUnit[] = [{
      amount:{
        currency_code:'PHP',
        value: String(totalPayment),
        breakdown:{
          item_total : {
            currency_code: 'PHP',
            value: String(totalItemPayment),
          }
        }
      },
      items: items,
      reference_id: 'Products'
    }]

    if(params['method'] === 'delivery'){
      const deliveryFeeDetails = JSON.parse(params['deliveryFeeDetails'])

      if(deliveryFeeDetails.calculated.price !== 'too_far'){
        console.log("deliveryFeeDetails",deliveryFeeDetails);
        purchase_units.push({
          amount: {
            currency_code:"PHP",
            value: String(deliveryFeeDetails.calculated.price),
            breakdown: {
              item_total : {
                currency_code:"PHP",
                value: String(deliveryFeeDetails.calculated.price)
              }
            }
          },
          items:[{
            name: `Delivery Fee ~ (${deliveryFeeDetails.actualDistance.distance.text})`,
            quantity: '1',
            unit_amount:{
              currency_code: "PHP",
              value: String(deliveryFeeDetails.calculated.price),
              breakdown:{
                item_total: {
                  currency_code: "PHP",
                  value: String(deliveryFeeDetails.calculated.price)
                }
              }
            },
          }],
          reference_id: 'Delivery Fee'
        })
        totalPayment             = totalPayment + deliveryFeeDetails.calculated.price
      }
    }

    if(order.voucherInfo){
      purchase_units[0].amount.breakdown!.discount = {
        currency_code:'PHP',
        value:`${this.discountValue(order)}`
      }
    }


    console.log("ITEMS",items);

    return {
      currency: 'PHP',
      clientId: environment.payPalClientId,
      createOrderOnClient: (data:any) => < ICreateOrderRequest > {
          intent: 'CAPTURE',
          purchase_units: purchase_units
      },
      advanced: {
          commit: 'true'
      },
      style: {
          label: 'paypal',
          layout: 'vertical'
      },
      fundingSource:'PAYPAL',

      onApprove: async (data:any, actions:any) => {
          console.log('onApprove - transaction was approved, but not authorized', data, actions);
          const details = await actions.order.get()
          console.log('onApprove - you can get full order details inside onApprove: ', details);
          await this.loading(true)
      },
      onClientAuthorization: async (data:any) => {
          console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
          this.placeOrder(order,data)
          await this.loading(false)
          //

      },
      onCancel: async (data:any, actions:any) => {
          console.log('OnCancel', data, actions);
          const errorAlert = await this.loadingController.create()
      },
      onError: async (err:any) => {
          console.log('OnError', err);
          await this.loading(true)
          // this.showError = true;
      },
      onClick: (data:any, actions:any) => {
          console.log('onClick', data, actions);
          // this.resetStatus();
      }
    };



  }

  async loading(show:boolean){
    if(show){
      if(!this.authorizedLoading){
        this.authorizedLoading = await this.loadingController.create({
          message: "Waiting authorization from Paypal"
        })
      }
      this.authorizedLoading.present()
    }
    else{
      if(this.authorizedLoading){
        await this.authorizedLoading.dismiss()
        this.authorizedLoading = undefined
      }
    }
  }


  discountValue(order:any){
    const itemValue = this.paymentData(order, false)
    if(order.voucherInfo.voucherDiscountType === 'flat'){
      const discountValue = itemValue - order.voucherInfo.voucherDiscountValue
      return discountValue > 0 ? order.voucherInfo.voucherDiscountValue : itemValue
    }
    else{
      return itemValue * (order.voucherInfo.voucherDiscountValue / 100 )
    }

  }

  paymentData(currentOrder:any, withVoucher:boolean){
    if(currentOrder && currentOrder != 'loading'){
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


  }

  async placeOrder(currentOrder:any, payPalData?:any){
    await this.dataQueries.placeOrder(currentOrder.id,this.address,this.method, this.clientDeliveryDate,this.deliveryFeeDetails, payPalData, this.specialInstructions)
    this.router.navigate(['/shop'],{
      queryParams: {
        goToShop:true
      },
      skipLocationChange: true,
    })
    // this.navCtrl.back()
  }







}
