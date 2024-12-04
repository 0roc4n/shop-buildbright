import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ModalController, NavParams } from '@ionic/angular';
import { DataqueriesService } from 'src/app/services/dataqueries.service';

@Component({
  selector: 'app-paypal',
  templateUrl: './paypal.component.html',
  styleUrls: ['./paypal.component.scss'],
  standalone: true,
  imports: [IonicModule]
})

export class PaypalComponent  implements OnInit {

  @ViewChild('paymentRef', {static:true}) paymentRef!:ElementRef

  @Input() totalCharge!: number;

  totalAmount = this.dq.goToPayment(this.totalCharge);
  transactionDetails:any
  
  constructor(private navParams: NavParams,
              private router: Router,
              private dq : DataqueriesService,
              private modal : ModalController) { }

  ngOnInit() {

    window.paypal.Buttons(
      {
      createOrder: (data:any, actions:any)=>{
        this.totalAmount = this.dq.goToPayment(this.totalCharge);
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: this.totalAmount.toString(),
                currency_code: 'PHP'
              }
            }
          ]
        })
      },
      onApprove: (data:any, actions:any)=>{
        return actions.order.capture().then((details:any)=> {
          if (details.status === 'COMPLETED') {
            this.transactionDetails =details;
            this.modal.dismiss(this.transactionDetails); 
            // this.router.navigateByUrl('/components/confirmation', {
            //   state: {
            //     transactionID: this.transactID,
            //   },
            // });
          }          
        })
      },
      onError: (error:any) => {
        console.log(error)
      }
    }
    ).render(this.paymentRef.nativeElement)
  }

  async goBack(){
     this.modal.dismiss('closed')
  }
}
