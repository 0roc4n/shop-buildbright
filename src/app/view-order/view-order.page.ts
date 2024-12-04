import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Database, onValue, ref } from '@angular/fire/database';
import { Router } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { OrderDetailHistoryComponent } from '../components/modals/order-detail-history/order-detail-history.component';
import { DataqueriesService } from '../services/dataqueries.service';
import { firstValueFrom, timestamp } from 'rxjs';
import { Status } from '../interfaces/status';
import { equalTo, orderByChild, query } from 'firebase/database';

@Component({
  selector: 'app-view-order',
  templateUrl: './view-order.page.html',
  styleUrls: ['./view-order.page.scss'],
})
export class ViewOrderPage implements OnInit {
  activeTab: Status = Status.Pending;


  clientID = JSON.parse(localStorage.getItem('userData')!).id
  shopId = JSON.parse(localStorage.getItem('shopId')!).id
  orderRef = query(ref(this.db, `/orders`), orderByChild('timestamp'));
  cartRef = ref(this.db, `/products/${this.shopId}`);
  cartIDComp:any[] = []
  orders:any[] = []
  totalPrice:number = 0
  data:Map<string,any> = new Map();
  status = Status;

  constructor(
    private db: Database, 
    private cdr: ChangeDetectorRef, 
    private router:Router,
    private modalController:ModalController,
    private dataQueries: DataqueriesService
    ) { }

  pending = 0;
  preparing = 0;
  ready = 0;
  delivered = 0;

  perItemPrice(product:any){
    if(product.bulk_price){
      return (product.bulk_price / product.quantity).toFixed(2);
    }else{
      return product.price;
    }
  }

  ngOnInit() {

    this.activeTab = Status.Pending;
    onValue(this.orderRef, (snapshot) => {
        const prod = snapshot.val();
        if(prod == null){
          this.data = new Map();
          return;
        }
        // console.log('Unsorted',prod)
        this.data = new Map([...new Map(Object.entries(prod)).entries()].sort((b:any,a:any)=>a[1].timestamp - b[1].timestamp))
        this.pending = Array.from(this.data.values()).filter((p:any) => p.status == Status.Pending && p.clientId == this.clientID ).length
        this.preparing =  Array.from(this.data.values()).filter((p:any) => p.status == Status.Preparing  && p.clientId == this.clientID).length
        this.ready =  Array.from(this.data.values()).filter((p:any) =>( p.status == Status.OrderReady || p.status == Status.OnDelivery)&& p.clientId == this.clientID).length
        this.delivered =  Array.from(this.data.values()).filter((p:any) => p.status == 3 && p.clientId == this.clientID).length
        // this.data = prod;
        // this.data.sort((a, b) => a.timestamp - b.timestamp)
        // console.log("Sorted",this.data)
    });
    this.cdr.detectChanges();
    
  }

  asIsOrder(a:any, b:any) {
    return 1;
  }

capitalize(str: any): string {
  if (typeof str !== 'string') {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

isOrderReady(stat:Status){
  return this.activeTab == Status.OrderReady &&  Math.floor(stat) == Status.OrderReady;
}

getStatus(order:any){
  // Database has type of word in status instead of int.. (error)
  // must convert old entries to int, temp sol => add case
  // fix for new entries, convert status to its int value 
  switch(order.status){
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
      return "Your Order is ready to be picked up!"
    case Status.OnDelivery:
      return "Your Order was picked up and is on the way!"
    case Status.Resolved:
      return "Your Return Order Was Resolved"
    case Status.Delivered :
      return order.deliveryMethod ==='pickup'? "Your Order was picked up" : "You Order was Delivered";
    case Status.WithReview:
      return order.deliveryMethod ==='pickup'? "Your Order was picked up" :  "Your Order was Delivered"
    default:
      return "ERROR"
  }
}
sortData(tabType: Status) {
  // Implement your data sorting logic based on the selected tab
  
  this.activeTab = tabType;
}

convertToArray(value: any): any[] {
  return Array.isArray(value) ? value : [value];
}

getProductLength(prod:any){
  return prod.length
}

goToShop(){
  this.router.navigate(['/shop'])
}





async viewOrderDetails(data: any , orderId: any){
  data.orderId = orderId;
  data.id = orderId;
  data.storeDetails = await firstValueFrom(this.dataQueries.getUserById(data.storeId))
  const modal = await this.modalController.create({
    component: OrderDetailHistoryComponent,
    componentProps:{
      orderDetail: data
      // orderData:{
      //   orderID:  orderID,
      //   clientDetails: this.data.find((items:any)=>items.data[0] === orderID).clientDetails
      // }
    },
  })
  modal.present()
}


}
