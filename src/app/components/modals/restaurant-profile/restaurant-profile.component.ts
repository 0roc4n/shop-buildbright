import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { ReplaySubject, takeUntil } from 'rxjs';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { HelperService } from 'src/app/services/helper.service';
import { OrderService } from 'src/app/services/order.service';
// import { CarouselComponent } from '../../carousel/carousel.component';

@Component({
    selector: 'app-restaurant-profile',
    templateUrl: './restaurant-profile.component.html',
    styleUrls: ['./restaurant-profile.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule] // CarouselComponent
})
export class RestaurantProfileComponent  implements OnInit, OnDestroy {

  restaurantData!:any
  productTtems!: any[]
  prodSorted: any[] = []
  unsubsribe = new ReplaySubject<void>()
  cart!:any

  constructor(private modalController: ModalController,
              private dataQueries:  DataqueriesService,
              public  helper    : HelperService,
              public  orderService: OrderService,
              private alertController: AlertController,
              private router: Router) { }
  ngOnDestroy(): void {
    this.unsubsribe.next()
  }

  ngOnInit() {
    console.log('restaurantID',this.restaurantData);
    this.getProducts()
    // this.orderService.order$.pipe(takeUntil(this.unsubsribe)).subscribe((data)=>{
    //     this.cart = data
    //     if(this.cart && this.cart.storeId !== this.restaurantData.id){
    //       this.confirmationAlert(this.cart.id)
    //     }
    //   console.log("Current Cart",data)
    // })
  }

  async getProducts(){
    // this.productTtems = this.helper.objToArrWithId((await this.dataQueries.getProducts(this.restaurantData.id)).val())

    // this.productTtems.forEach((prod)=>{
    //   if(prod.variants) {
    //     prod.variants = Object.entries(prod.variants).map((v)=>{
    //       return{
    //         name: v[0],
    //         value: v[1]
    //       }
    //     })
    //   }
    //   const found = this.prodSorted.findIndex((sort)=> sort.cat === prod.category)
    //   if(found > 0){
    //     this.prodSorted[found].products.push(prod)
    //   }
    //   else{
    //     this.prodSorted.push({
    //       cat: prod.category,
    //       products: [prod]
    //     })
    //   }
    // })
    // console.log("this.productTtems",this.productTtems);
  }

  addToCart(items:any, variation?: any){
    let operation:any
    let itemToPush: any[]
    const newItem: any = {
      name      : items.name,
      productId : items.id,
      qty       : 1,
      unitPrice : variation?.value ?? items.price,
      totalPrice: variation?.value ?? items.price
    }

    if(this.cart?.status !== 0){
      operation = 'add'
      itemToPush = [newItem]
    }
    else{
      itemToPush = [...this.cart.items,newItem]
      operation = this.cart.id
    }

    if(variation)newItem.variation = variation.name
    // this.orderService.addToCart(this.restaurantData.id, itemToPush , operation)
  }


  async confirmationAlert(storeId:string){
    const alert = await this.alertController.create({
      header: 'Confirm',
      message: 'You have an ongoing order to a different store. Remove that order?',
      buttons:[{
        text: 'Cancel',
        role: 'cancel',
        handler:()=>{
          this.modalController.dismiss()
        }
      },{
        text:'Ok',
        handler:()=>{
          console.log("storeId",storeId);

          // this.orderService.deleteCart(storeId)
        }
      }]
    })

    alert.present()
  }

  get calculateTotalCost(){
    return this.cart.items.reduce()
  }


  back(){
    this.modalController.dismiss()
  }

  get total() : number{
    return this.cart.items.reduce((prev:number,curr:any)=>{
      return curr.unitPrice * curr.qty + prev
    },0)
  }

  goToCart(){
    this.modalController.dismiss()
    this.router.navigate(['cart'],{
      queryParams:{
        restaurantId: this.restaurantData.id,
        from:'restaurant'
      }
    })
  }

  checkInCart(prodId:string, varName?:string){
    return  this.cart? this.cart.items.findIndex((item: any)=> prodId === item.productId && varName === item.variation) < 0 : true
  }


}
