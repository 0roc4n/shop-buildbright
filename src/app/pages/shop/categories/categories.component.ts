import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, map } from 'rxjs';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,

})
export class CategoriesComponent  implements OnInit, OnChanges {
  // @Input() productTtems!:any[]
  @Input() categories!:any[]
  @Input() shopData!:any

  constructor(public  productService: ProductService,
              private router : Router) { }

  allProducts:any[] = [];
  async ngOnInit() {
    // console.log("Categpries Init",this.categories);
    this.allProducts = (await firstValueFrom(this.productService.completeProducts$.pipe(
      map((prods: any[])=>prods[1])
    )))
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log("shopData", this.shopData);

  }

  countProductsByCategoryId(categoryId: string){
    const products =this.allProducts.filter((product:any) => {
      return product.category == categoryId;
    })
    return products.length;
  }

  countProductsBySubId(categoryId: string, subCatId:string){
    const products =this.allProducts.filter((product:any) => {
      if(product.category == categoryId){ 
        return product.subcategory == subCatId
      }else{
        return false;
      }
    })
    return products.length;
  }

  toggleSubCat(category:any){
    if(category.sub == null){
      category.sub = true;
    }else{
      category.sub = !category.sub;
    }
  }

  filteredProduct(categoryId:string, categoryName:string){
    this.router.navigate(['product-filter'],{
      queryParams:{
        categoryId   : categoryId,
        categoryName : categoryName,
        shopData     : JSON.stringify(this.shopData)
      },
      skipLocationChange:true
    })
  }

  filteredProductBySub(categoryId:string, subId:string, subName:string){
    this.router.navigate(['product-filter'],{
      queryParams:{
        categoryId   : categoryId,
        subId: subId,
        categoryName : subName,
        shopData     : JSON.stringify(this.shopData)
      },
      skipLocationChange:true
    })
  }
}
