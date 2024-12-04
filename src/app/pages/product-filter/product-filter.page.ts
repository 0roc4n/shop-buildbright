import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-product-filter',
  templateUrl: './product-filter.page.html',
  styleUrls: ['./product-filter.page.scss'],
})
export class ProductFilterPage implements OnInit {

  categoryName!:string
  categoryId!  :string
  subId?:string;
  shopData!:any

  filteredProd!:Observable<any>
  filteredProducts:any[] = [];

  constructor(private actRoute    : ActivatedRoute,
              private dataQueries : DataqueriesService,
              public  productService: ProductService) { }

  ngOnInit() {
    console.log("this.actRouteSnap.queryParams",this.actRoute.snapshot.queryParams);

    this.categoryName = this.actRoute.snapshot.queryParams['categoryName']
    this.categoryId   = this.actRoute.snapshot.queryParams['categoryId']
    this.subId   = this.actRoute.snapshot.queryParams['subId']
    this.shopData     = JSON.parse(this.actRoute.snapshot.queryParams['shopData'])
  
    this.filteredProd = this.dataQueries.getProductByCategory(this.categoryId,this.shopData.id)?.pipe(
      map((filtered:any)=>filtered.sort((a:any, b:any) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1
        if (nameA > nameB) return  1
        return 0
        })
      )
    )

    this.filteredProd.subscribe((products:any[])=>{
      this.filteredProducts = [];
      if(this.subId){
        this.filteredProducts = this.filterBySub(products,this.categoryId, this.subId);
      }else{
        this.filteredProducts = products
      }
    })

    

  }
  filterBySub(filterProd:any[],categoryId: string, subCatId:string){
    const products =filterProd.filter((product:any) => {
      if(product.category == categoryId){ 
        return product.subcategory == subCatId
        // return  product.category.subcategories?.filter((subcat:any)=>{
        //   return subcat.id == subCatId;
        // });
      }else{
        return false;
      }
    })
    return products;
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

  getMinMaxPrice(data: any) {
    let minMaxPrice = '0';
  
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
                  maxPrice = Math.max(maxPrice, currentPrice);
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
                    maxPrice = Math.max(maxPrice, currentPrice);
                  }
                });
              }
            }
          }
        }
      }
  
      if (minPrice === maxPrice) {
        minMaxPrice = `₱${minPrice}`;
      } else {
        minMaxPrice = `₱${minPrice} - ₱${maxPrice}`;
      }
      return minMaxPrice;
    } else {
      return `₱${data.price}`
    }
  }

}
