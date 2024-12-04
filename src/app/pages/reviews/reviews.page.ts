import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, Observable, ReplaySubject, Subject, bindCallback, combineLatest, firstValueFrom, forkJoin, map, switchMap, takeUntil, tap } from 'rxjs';
import { AddReviewComponent } from 'src/app/components/add-review/add-review.component';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { ProductService } from 'src/app/services/product.service';
import Swiper from 'swiper';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.page.html',
  styleUrls: ['./reviews.page.scss'],
})
export class ReviewsPage implements OnInit, OnDestroy{

  @ViewChild('pageswiper')pageswiper!: ElementRef

  tab$ = new BehaviorSubject<number>(0)

  // tab:number = 0;
  unsubscribe$ = new Subject<void>();

  allProducts!:any

  boughtItems$!:Observable<any>


  reviewedProducts$!: Observable<any>



  constructor(private dataQueries    : DataqueriesService,
              private productService : ProductService,
              private modalController: ModalController) { }


  async ngOnInit() {

    const allProdsPipe$ = this.productService.completeProducts$.pipe(
      map((allDetails)=> allDetails[1])
    )

    const reviews$ = this.dataQueries.getUserReviews()

    this.reviewedProducts$ = allProdsPipe$.pipe(
      switchMap((allProducts)=>{
        return reviews$.pipe(
          map((reviewData:any)=>{
            return reviewData.map((review:any)=>{
              return{ 
                ...review,
                productDetails: allProducts.find((product:any)=>product.id === review.productId)}
            }).sort((a:any, b:any) => b.timestamp - a.timestamp )
          })
        )
      })
    )

    this.boughtItems$ = allProdsPipe$.pipe(
      switchMap((allProducts)=> 
        reviews$.pipe(
          switchMap((reviewed:any)=> 
            this.dataQueries.getOrderHistory().pipe(
              map((orders)=>{
                const prevItems: any[] = []
                orders.forEach((order)=>{
                  if(order.status >= 3){
                    order.products.forEach((item: any)=>{
                      const found = prevItems.filter((prevItem)=>prevItem.productId === item.productId)
                      if(found.length){
                        if(item.variants){
                          if(item.variants.length > 1){
                            if(!found.some((foundItem:any)=> foundItem.variantIndex === item.variants[0].variantIndex)){
                              if(!found.some((foundItem:any)=> foundItem.type === item.variants[1].variantIndex)){
                                prevItems.push({
                                  // productId      : item.productId,
                                  ...item,
                                  variantIndex   : item.variants[0].variantIndex,
                                  type   : item.variants[1].variantIndex,
                                  productDetails : allProducts.find((product:any)=>product.id === item.productId)
                                })
                              }
                            }
                          }
                          else{
                            if(!found.some((foundItem:any)=> foundItem.variantIndex === item.variants[0].variantIndex)){
                              prevItems.push({
                                ...item,
                                // productId      : item.productId,
                                variantIndex   : item.variants[0].variantIndex,
                                productDetails : allProducts.find((product:any)=>product.id === item.productId)
                              })
                            }
                          }
                        }else{
                          if(!found.some((foundItem:any)=> foundItem.productId === item.productId)){
                            prevItems.push({
                              // productId      : item.productId,
                              ...item,
                              productDetails: allProducts.find((product:any)=>product.id === item.productId)
                            })
                          }
                        }
                      }
                      else{
                        const clientReviewed = reviewed.filter((review:any)=>review.productId === item.productId)
                        if(clientReviewed.length > 0){
                          if(item.variants){
                              if(item.variants.length <= 1){
                                const variant = item.variants[0];
                                if(clientReviewed.length === 0 || clientReviewed.filter((review:any)=>review.variantIndex === variant.variantIndex).length === 0){
                                  prevItems.push({
                                    ...item,
                                    // productId      : item.productId,
                                    variantIndex   : variant.variantIndex,
                                    productDetails : allProducts.find((product:any)=>product.id === item.productId)
                                  }) 
                                }
                              }else{
                                const variant = item.variants[0];
                                const type = item.variants[1];
                                if(clientReviewed.length === 0 || clientReviewed.filter((review:any)=>review.variantIndex === variant.variantIndex).length === 0){
                                  if(clientReviewed.length === 0 || clientReviewed.filter((review:any)=>review.variantIndex === type.variantIndex).length === 0){
                                    prevItems.push({
                                      ...item,
                                      productId      : item.productId,
                                      variantIndex   : variant.variantIndex,
                                      type           : type.variantIndex,
                                      productDetails : allProducts.find((product:any)=>product.id === item.productId)
                                    }) 
                                  }
                                }
                              }
                          }else{

                            if(clientReviewed.length === 0 || clientReviewed.filter((review:any)=>review.productId === item.productId).length === 0){
                              prevItems.push({
                                // productId      : item.productId,
                                ...item,
                                productDetails: allProducts.find((product:any)=>product.id === item.productId)
                              })
                            }
                           
                          }
                          // item.variants.forEach((variant:any)=>{
                          //   if(clientReviewed.length === 0 || clientReviewed.filter((review:any)=>review.variantIndex === variant.variantIndex).length === 0){
                          //     prevItems.push({
                          //       productId      : item.productId,
                          //       variantIndex   : variant.variantIndex,
                          //       productDetails : allProducts.find((product:any)=>product.id === item.productId)
                          //     }) 
                          //   }
                          // })
                        }
                        else if(clientReviewed.length === 0){
                          if(item.variants){
                            if(item.variants.length <= 1){
                              const variant = item.variants[0];
                              prevItems.push({
                                ...item,
                                // productId      : item.productId,
                                variantIndex   : variant.variantIndex,
                                productDetails : allProducts.find((product:any)=>product.id === item.productId)
                              }) 
                            
                            }else{
                              const variant = item.variants[0];
                              const type = item.variants[1];
                              prevItems.push({
                                ...item,
                                productId      : item.productId,
                                variantIndex   : variant.variantIndex,
                                type           : type.variantIndex,
                                productDetails : allProducts.find((product:any)=>product.id === item.productId)
                              }) 
                
                            }
                          }else{
                            prevItems.push({
                              // productId      : item.productId,
                              ...item,
                              productDetails: allProducts.find((product:any)=>product.id === item.productId)
                            })
                          }
                          
                        }
                      }
                    })
                  }
                })
                console.log('PREVITEMS',prevItems);
                return prevItems
              }),
            ))
      )),
    )
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next()
  }

  changeTab($event:any){
    (this.pageswiper.nativeElement.swiper as Swiper).slideTo($event.detail.value)
  }

  swiperSlideChanged(event:any){
    this.tab$.next(event.detail[0].activeIndex)  
  }


  async addReview(completeProdDetails:any){
    const modal = await this.modalController.create({
      component: AddReviewComponent,
      componentProps: {
        completeProdDetails: completeProdDetails,
        reviewed: false
      }
    })

    modal.present()
  }

  async viewReview(completeProdDetails:any){
    const modal = await this.modalController.create({
      component: AddReviewComponent,
      componentProps: {
        completeProdDetails: completeProdDetails,
        reviewed : true,
      }
    })

    modal.present()
  }

}
