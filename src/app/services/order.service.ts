import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, ReplaySubject, switchMap, tap } from 'rxjs';
import { Cart, OrderItem } from '../interfaces/order';
import { DataqueriesService } from './dataqueries.service';
import { HelperService } from './helper.service';
import { ModalController } from '@ionic/angular';
import { CartModalComponent } from '../components/modals/cart-modal/cart-modal.component';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  currentOrder$ = new BehaviorSubject<any>('loading')


constructor(private dataQueries: DataqueriesService,
              private helper     : HelperService,
              private modalController: ModalController) { 
                // this.dataQueries.getCurrentOrder().pipe(
                //   tap((order)=>{
                //     this.currentOrder$.next(order)
                //   })
                // ).subscribe()
              }



  async openCart(){
    const modal = await this.modalController.create({
      component: CartModalComponent
    })
    modal.present()
  }


}
