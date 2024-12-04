import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, ModalController } from '@ionic/angular';
import { ReviewIconsComponent } from "../../review-icons/review-icons.component";
import { BehaviorSubject, Observable, firstValueFrom, map } from 'rxjs';
import { ProductService } from 'src/app/services/product.service';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, ReviewIconsComponent]
})
export class SearchComponent  implements OnInit {

  addBulk:boolean = false;
  
  // filteredItems$ = new BehaviorSubject<any[]>([])
  filteredItems$ = new Observable<any[]>()
  allProducts$ = new Observable<any[]>()
  categories$ = new Observable<any[]>()

  shopData$ = this.productService.productDetails$.pipe()
  allProducts :any[] =[]
  categories:any;
  constructor(private modalController: ModalController,
              private productService: ProductService,
              private loadingController: LoadingController
              ) { }

  loader:any;
  async ngOnInit() {
    // if(this.addBulk){
    //   this.loader = await this.loadingController.create({
    //     message: 'Loading Products...'
    //   })
    //   this.loader.present();
    // }
    // this.allProducts = (await firstValueFrom(this.productService.completeProducts$.pipe(
    //   map((prods: any[])=>prods[1])
    // )))
    // this.categories = (await firstValueFrom(this.productService.completeProducts$.pipe(
    //   map((prods: any[])=>prods[2])
    // )))
    // if(this.addBulk){
    //   this.filteredItems$.next(this.allProducts.slice(0,this.limit))
    //   this.loader.dismiss();
    // }
    this.allProducts$ = this.productService.completeProducts$.pipe(
      map((prods: any[])=>prods[1])
    )
    this.categories$ = this.productService.completeProducts$.pipe(
      map((prods: any[])=>prods[2])
    )
    // if(this.addBulk){
      // this.filteredItems$ = this.allProducts$.pipe(map(prods=>prods.slice(0,this.limit)))
      // W
    this.filteredItems$ =  this.allProducts$.pipe(map(all=>all.sort((a:any, b:any) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return -1
      if (nameA > nameB) return  1
      return 0
    })))
  }
  limit = 10;
  viewMore(){
    this.limit  += 10;
  }
  range = {
    lower: 0,
    upper:50
  }
  setRange(event:any){
    this.range = event.target.value
  }

  multiplier(value:number){
    return Math.round((value/100) * 1500)
  }

  hasMore(items:any){
    return items.length > this.limit
  }
  minRange = 0;
  maxRange = 9999999999;
  categoriesFilter:string[] = []
  selectedCategories:string[] = []
  selectedSubcategories:string[] = [];
  selected(category:string){
    return this.selectedCategories.includes(category);
  } 
  subSelected(sub:string){
    return this.selectedSubcategories.includes(sub);
  }

  toggleSelect(category:any){
   if(this.selected(category.id)){
    const index = this.selectedCategories.indexOf(category.id);
;
    if(category.subcategories){
      for(let subcat of category.subcategories){
        if(this.selectedSubcategories.includes(subcat.id)){
          const ind = this.selectedSubcategories.indexOf(subcat.id);
          this.selectedSubcategories.splice(ind,1);
        }
      }
    }
    this.selectedCategories.splice(index, 1)
   }else{
    this.selectedCategories.push(category.id);
   }
  }

  toggleSelectSub(category:string){
    if(this.subSelected(category)){
     const index = this.selectedSubcategories.indexOf(category);
     this.selectedSubcategories.splice(index, 1);
    }else{
     this.selectedSubcategories.push(category);
    }
   }

  countProductsByCategoryId(categoryId: string, all:any){
    const products =all.filter((product:any) => {
      return product.category == categoryId;
    })
    return products.length;
  }

  countProductsBySubCategoryId(categoryId: string, sub:string, all:any){
    const products =all.filter((product:any) => {
      return product.category == categoryId && product.subcategory == sub;
    })
    return products.length;
  }


  applyFilters(){
    this.minRange = this.multiplier(this.range.lower);
    this.maxRange = (this.range.upper == 100)? Infinity: this.multiplier(this.range.upper);
    this.categoriesFilter = this.selectedCategories;
    this.showingFilters = false;
    // if(true){
      // const all:any = this.allProducts
      // this.filteredItems$.next(all.filter((items:any)=>{
      //     if((items.metaKeyword.toLowerCase().includes(this.searchValue.toLowerCase()) )
      //     &&
      //     (this.getMinPrice(items) >= this.minRange && this.getMinPrice(items) <= this.maxRange)
      //     &&
      //     (this.categoriesFilter.includes(items.category) || !this.categoriesFilter.length) 
      //     ){
      //       return true
      //     }else{
      //       return false;
      //     }
      //   // }
      // }))
      this.filteredItems$ = this.allProducts$.pipe(map(all=>all.filter((items:any)=>{
          if((items.metaKeyword.toLowerCase().includes(this.searchValue.toLowerCase()) )
          &&
          (this.getMinPrice(items) >= this.minRange && this.getMinPrice(items) <= this.maxRange)
          &&
          (this.categoriesFilter.includes(items.category) || !this.categoriesFilter.length) 
          ){
            return true
          }else{
            return false;
          }
          // }
        }))
      )
    // }
  }

  searching = false;
  searchValue:string = ''
  async onSearchChange(event:any){
    this.searchValue = event.detail.value;
    if(event.detail.value == ''){
      // this.filteredItems$ = new Observable<any[]>();
      this.filteredItems$ =  this.allProducts$.pipe(map(all=>all.sort((a:any, b:any) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1
        if (nameA > nameB) return  1
        return 0
      })))
      this.searching = false;
    }
    else{
      this.searching = true;
      // const all:any = this.allProducts
      // this.filteredItems$.next(all.filter((items:any)=>{
      //     if((items.metaKeyword.toLowerCase().includes(event.detail.value.toLowerCase()) )
      //     &&
      //     (this.getMinPrice(items) >= this.minRange && this.getMinPrice(items) <= this.maxRange)
      //     &&
      //     (this.categoriesFilter.includes(items.category) || !this.categoriesFilter.length) 
      //     ){
      //       return true
      //     }else{
      //       return false;
      //     }
      //   // }
      // }))
      this.filteredItems$ = this.allProducts$.pipe(map(all=>all.filter((items:any)=>{
        if((items.metaKeyword.toLowerCase().includes(event.detail.value.toLowerCase()) )
        &&
        (this.getMinPrice(items) >= this.minRange && this.getMinPrice(items) <= this.maxRange)
        &&
        (this.categoriesFilter.includes(items.category) || !this.categoriesFilter.length) 
        ){
          return true
        }else{
          return false;
        }
      // }
    })))
    }
  }


  getDiscountedPrice(price:any, discount:number){
    return Number((Number(price) - (Number(price) * (discount/100))).toFixed(2));
  }

  getMinPrice(data: any) {
    let minMaxPrice = 0;
  
    if (data.variants) {
      let minPrice = Number.MAX_VALUE;
      let maxPrice = 0;
  
      for (const key in data.variants) {
        if(key === 'color' || key === 'size'){
          if (data.variants.hasOwnProperty(key)) {
            const value = data.variants[key];
    
            if (Array.isArray(value)) {
              value.forEach((price) => {
                if (typeof price.price === 'number') {
                  const currentPrice = price.price;
                  minPrice = Math.min(minPrice, currentPrice);
                }
              });
            }
          }
        } else {
          if(key === 'type'){
            if (data.variants.hasOwnProperty(key)) {
              const value = data.variants[key];
      
              if (Array.isArray(value)) {
                value.forEach((price) => {
                  if (typeof price.price === 'number') {
                    const currentPrice = price.price;
                    minPrice = Math.min(minPrice, currentPrice);
                  }
                });
              }
            }
          }
        }
      }
  
      return minMaxPrice  = data.discount > 0 ?  this.getDiscountedPrice(minPrice, data.discount) : minPrice;
    } else {
      return data.price
    }
  }
  
  dismiss(){
    this.modalController.dismiss()
  }


  showingFilters = false;
  showFilters(){
    this.showingFilters = !this.showingFilters;
  }
  async goToProductDetails(prod:any){
    const shopData = (await firstValueFrom(this.productService.completeProducts$.pipe(
      map((prods: any[])=>prods[0])
    )))
    if(this.addBulk){
      this.productService.goToProductDetails(prod,shopData, true)
    }else{

      this.productService.goToProductDetails(prod,shopData)
    }
    this.dismiss()
  }

  getFirstImageRef(productItem:any) {
    let firstKey: string | undefined;

    if (productItem.variants) {
      for (const key in productItem.variants) {
          if (productItem.variants.hasOwnProperty(key)) {
              firstKey = key;
              break;
          }
      }
    }

    if (firstKey) {
      return productItem.variants[firstKey][0].image[0].imageRef;
    } else{
        return productItem.images[0].imageRef;
    }
  }
  getAverageRating(productDetails:any){
    console.log(productDetails);
    console.log(productDetails.id);
    if(productDetails.variants){
      if(productDetails.variants.colors){
        var totalRating = 0;
        var ratings = 0;
        for(let i =0; i < productDetails.variants.colors.length; i++){
          for(let j = 0; j < productDetails.variants.colors[i].types.length; j++){
            if(productDetails.variants.colors[i].types[j].totalRating!=null){
              totalRating += productDetails.variants.colors[i].types[j].totalRating;
              ratings +=1;
            }
          }
        }
        return ratings ? (totalRating/ ratings).toFixed(1) : 0
      }else{
        var totalRating = 0;
        var ratings = 0;
        for(let i =0; i < productDetails.variants.size.length; i++){
          if(productDetails.variants.size[i].totalRating!= null){
            totalRating += productDetails.variants.size[i].totalRating;
            ratings +=1;
          }
        }
        return ratings ? (totalRating/ratings).toFixed(1) : 0
      }
    }else{
      return productDetails.totalRating != null ? productDetails.totalRating.toFixed(1) :0;
    }
  }

}
