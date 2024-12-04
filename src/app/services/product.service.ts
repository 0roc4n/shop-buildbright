import { Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, ReplaySubject, from, map, pipe, switchMap, take, tap } from 'rxjs';
import { DataqueriesService } from './dataqueries.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService implements OnInit{

  productDetails$ = new ReplaySubject<any>()
  shopData$ = new ReplaySubject<any>()

  completeProducts$ = new ReplaySubject<any>()

  bestSeller$ = new ReplaySubject<any>(1)

  // availableVouchers$ =
  constructor(private router: Router,
              private dataQueries: DataqueriesService) {

                this.dataQueries.getProducts()
                .subscribe({
                  next:(shopProdData)=>{
                    this.completeProducts$.next(shopProdData)
                  }
                })

                this.dataQueries.getFocusAllOrders().pipe(
                  map((orders:any)=>{

                    const prodArray:any[] = []

                    orders.forEach((order:any)=>{
             ;
                      order.products.forEach((item:any)=>{

                        const prodInd =  prodArray.findIndex((prod:any)=>prod.productId === item.productId)
                        if(prodInd < 0){
                          prodArray.push({
                            productId: item.productId,
                            // quantity : item.variants ? item.variants.reduce((prev:number, curr:any)=> curr.quantity +  prev,0) : item.quantity
                            quantity : item.quantity
                          })
                        }
                        else{
                          // prodArray[prodInd].quantity += item.variants ? item.variants.reduce((prev:number, curr:any)=> curr.quantity +  prev,0) : item.quantity
                          prodArray[prodInd].quantity += item.variants ? item.variants.reduce((prev:number, curr:any)=> curr.quantity +  prev,0) : item.quantity
                        }
                      })
                    })
                    // console.log('product array',prodArray)

                    const sortedArr = prodArray.sort((curr:any,next:any)=>{
                        if(curr.quantity > next.quantity) return -1
                        else if (curr.quantity < next.quantity)  return 1
                        else return 0
                      }).slice()

                    return sortedArr.length < 10 ? sortedArr : sortedArr.slice(0, 10)
                  }
                ),
                take(1),
                switchMap((prodIDArray)=>{
                  return this.completeProducts$.pipe(
                    map((allProducts)=>{
                      return prodIDArray.map((prodId)=>{
                        return {
                          ...prodId,
                          productDetails: allProducts[1].find((prod:any)=>prod.id === prodId.productId)
                        }
                      })
                    }),
                  )
                })
                ).subscribe({
                  next:(bestSelling:any)=> {
                    this.bestSeller$.next(bestSelling)
                  }
                })

              }


  ngOnInit(){
  }


  goToProductDetails(product:any, shopData: any, bulk?:boolean){
    const _bulk = bulk?? false;  
    this.router.navigate(['product-details'],{
        onSameUrlNavigation: 'reload',
        queryParams:{
          bulk:_bulk,

        },
      })
      this.productDetails$.next(product)
      this.shopData$.next(shopData)
  }



}
