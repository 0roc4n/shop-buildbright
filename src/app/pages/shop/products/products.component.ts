import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent  implements OnInit {
  @Input() productTtems!:any[]
  @Input() shopData!:any
  constructor(public productService: ProductService) { }

  ngOnInit() {



  }

  getFirstImageRef(productItem:any) {
    let firstKey: string | undefined;

    if (productItem.variants) {
      for (const key in productItem.variants) {
          if (productItem.variants.hasOwnProperty(key)) {
              firstKey = key;
              console.log('IMAGEVALUE', firstKey);
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
