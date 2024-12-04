import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subject, concatMap, firstValueFrom, map, of, takeUntil, tap } from 'rxjs';
import { OrderDetailHistoryComponent } from 'src/app/components/modals/order-detail-history/order-detail-history.component';
import { DataqueriesService } from 'src/app/services/dataqueries.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.page.html',
  styleUrls: ['./order-history.page.scss'],
})
export class OrderHistoryPage implements OnInit , OnDestroy{

  unsubscribe$ = new Subject<void>()

  orderHistory$ = this.dataQueries.getOrderHistory().pipe(
    concatMap(async(orders:any[])=> await Promise.all(
          orders?.filter((order)=>order.status !== 0).map(async(order: any)=>{
            order.storeDetails = await firstValueFrom(this.dataQueries.getUserById(order.storeId))
            return order
          })
        )
    ),
    map((orders:any[])=> orders.sort((prev,curr)=>  curr.timestamp - prev.timestamp)),
    //  tap((see)=>{
    //   console.log("See", see);
    // }),
    takeUntil(this.unsubscribe$)
  )

  constructor(private dataQueries: DataqueriesService,
              private modalController: ModalController) { }

  ngOnInit() {
  }

  ngOnDestroy(){
    this.unsubscribe$.next()
  }

  async orderDetails(orderDetail:any){
    let voucherDetails = null;

    if(orderDetail.voucherId){
      voucherDetails = await firstValueFrom(this.dataQueries.getVoucher(orderDetail.storeId,orderDetail.voucherId))
    }

    const modal = await this.modalController.create({
      component: OrderDetailHistoryComponent,
      componentProps: {
        orderDetail : orderDetail,
        voucherDetails: voucherDetails
      }
    })
    modal.present()
  }


}
