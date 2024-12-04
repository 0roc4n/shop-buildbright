import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { ReplaySubject, tap } from 'rxjs';
import { SearchComponent } from 'src/app/components/modals/search/search.component';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { HelperService } from 'src/app/services/helper.service';
import { OrderService } from 'src/app/services/order.service';
import { ProductService } from 'src/app/services/product.service';
import Swiper, { SwiperOptions } from "swiper";
@Component({
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  styleUrls: ['./shop.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ShopPage implements OnInit{
  // @ViewChild('pageswiper')pageswiper!: ElementRef

  shopDetails: any;
  // productTtems: any[] = [];
  currentPage = this.fb.control("0")

  shopData$     = new ReplaySubject<any>(1)
  allProductItems$ = new ReplaySubject<any>(1)
  categories$   = new ReplaySubject<any>(1)
  shopName = '';

  limitedProdItems$ = new ReplaySubject<any>(1)

  constructor(private actRoute: ActivatedRoute,
              private dataQueries: DataqueriesService,
              private alertController: AlertController,
              private loadingController: LoadingController,
              private helper: HelperService,
              private fb: FormBuilder,
              private orderService: OrderService,
              private productService: ProductService,
              private modalController: ModalController,
              private router: Router
              ) {
                this.actRoute.queryParams.pipe(
                  tap((params)=>{
                    if(params['goToShop']){
                      this.currentPage.setValue('4')
                    }
                  })
                ).subscribe()
              }

  ngOnInit() {
    
    this.getShopData()
  }

  
  goToCart(){
    this.router.navigateByUrl('/view-cart')
  }
  slidePageChange(event:any){
    event.stopPropagation();
    this.currentPage.setValue(event.detail[0].activeIndex,{
      emitEvent:false
    })
  }

  async getShopData($event?:any){
    const loading = await this.loadingController.create({
      message: "Fetching Products..."
    });

    loading.present()
    this.productService.completeProducts$.pipe(
      tap((shopData)=>{
        this.shopName = shopData[0].storeName;
        this.shopData$.next(shopData[0])
        this.allProductItems$.next(shopData[1])
        // console.log('PRODUCTS',shopData[1])
        this.categories$.next(shopData[2].sort((a:any, b:any) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA < nameB) return -1
          if (nameA > nameB) return  1
          return 0
        }))
      })
    )
    .subscribe({
      next:()=>{
        $event?.target.complete()
        loading.dismiss()
      }
    })

    this.allProductItems$.subscribe((allProducts)=>{
        this.limitedProdItems$.next(allProducts.reverse().slice(0, 8));
      }
    )
  }

  



  refresh(event:any){
    this.getShopData(event)
  }

  openCart(){
    this.orderService.openCart()
  }

  async filterSearch(){
    const modal = await this.modalController.create({
      component: SearchComponent
    })

    modal.present()
  }

  goToViewOrder(){
    try{
      this.router.navigate(['view-order'])
      console.log('Success Routing')
    } catch (error) {
      console.log('Error in going to view order page', error);
    }
  }
}