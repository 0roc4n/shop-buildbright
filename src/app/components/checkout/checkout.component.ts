import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ICreateOrderRequest, IPayPalConfig, NgxPayPalModule } from 'ngx-paypal';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { PushNotifService } from 'src/app/services/push-notif.service';
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: true,
  imports:[CommonModule, IonicModule, NgxPayPalModule]
})
export class CheckoutComponent  implements OnInit {

  payPalConfig?: IPayPalConfig;

  constructor(private dataQueries: DataqueriesService,
              private pushNotif: PushNotifService) { }

  ngOnInit() {}
  
  initConfig(){
    this.payPalConfig = {
        currency: 'EUR',
        clientId: 'sb',
        createOrderOnClient: (data:any) => < ICreateOrderRequest > {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'EUR',
                    value: '9.99',
                    breakdown: {
                        item_total: {
                            currency_code: 'EUR',
                            value: '9.99'
                        }
                    }
                },
                items: [{
                    name: 'Enterprise Subscription',
                    quantity: '1',
                    category: 'DIGITAL_GOODS',
                    unit_amount: {
                        currency_code: 'EUR',
                        value: '9.99',
                    },
                }]
            }]
        },
        advanced: {
            commit: 'true'
        },
        style: {
            label: 'paypal',
            layout: 'vertical'
        },
        onApprove: async (data:any, actions:any) => {
            console.log('onApprove - transaction was approved, but not authorized', data, actions);
            const details = await actions.order.get()
            console.log('onApprove - you can get full order details inside onApprove: ', details);

        },
        onClientAuthorization: (data:any) => {
            console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
            // this.showSuccess = true;
        },
        onCancel: (data:any, actions:any) => {
            console.log('OnCancel', data, actions);
            // this.showCancel = true;

        },
        onError: (err:any) => {
            console.log('OnError', err);
            // this.showError = true;
        },
        onClick: (data, actions) => {
            console.log('onClick', data, actions);
            // this.resetStatus();
        }
      };
    }

  async placeOrder(addressArray: any, currentOrder:any){
    // const clientDeliveryDate =  this.deliveryDateType.value === 'set_date'
    // ? new Date(this.deliveryDate.value!).getTime()
    // : new Date(this.dateToday).getTime()
    // const address = this.addressSelection.value < 0 ? await firstValueFrom(this.currentAddress$) : addressArray[this.addressSelection.value]
    // const deliveryFeeDetails = await firstValueFrom(this.calculatedPriceDistance$)
    // this.dataQueries.placeOrder(currentOrder.id,address,this.method.value!, clientDeliveryDate,deliveryFeeDetails)
    // this.pushNotif.sendMessage(currentOrder.storeInfo.pushNotifKey,currentOrder.id)
  }

}
