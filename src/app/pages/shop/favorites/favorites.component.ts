import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Database , ref , onValue , child , remove , update } from '@angular/fire/database';
import { NavigationExtras, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent implements OnInit{

  clientId = JSON.parse(localStorage.getItem('userData')!).id;
  cartRef = ref(this.db, `/favorites/${this.clientId}`);
  cartData:any
  favorite = false
  shopData:any =  JSON.parse(localStorage.getItem('shopId')!);

  products: any[] = []

  constructor(private alertController : AlertController,
              private db              : Database,
              private cdRef           : ChangeDetectorRef,
              private router          : Router,
              private dq              : DataqueriesService,
              public productService   : ProductService,) { }

  ngOnInit() {
    
    onValue(this.cartRef, async (snapshot) => {
      this.cartData = snapshot.val();
      
      if (this.cartData) {
        for (const key in this.cartData) {
          if (this.cartData.hasOwnProperty(key)) {
            const cartValue = this.cartData[key]
            const existingProductIndex = this.products.findIndex(product => product.cartId === key);

            if(existingProductIndex !== -1){
              this.products[existingProductIndex].quantity = cartValue.quantity;
              } else {
                const product = await firstValueFrom(this.dq.getProductById(cartValue.productData.id, this.shopData.id))
                if(product == null){
                  continue;
                }
                const data = {
                  cartId : key,
                  productData : cartValue.productData,
                  shopData : cartValue.shopData,
                  name : cartValue.name,
                  price : this.getMinMaxPrice(cartValue.productData,true),
                  images : cartValue.image.imageRef,
                  state : cartValue.state
                }
                this.products.push(data)
              }
            }
          }
        }

    });

    this.cdRef.detectChanges();

  }  

  getMinMaxPrice(data: any, discounted?:boolean) {
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
        minMaxPrice = discounted ?  `₱${this.getDiscountedPrice(minPrice, data.discount)}` : `₱${minPrice}`;
      } else {
        minMaxPrice = discounted ? `₱${this.getDiscountedPrice(minPrice, data.discount)} - ₱${this.getDiscountedPrice(maxPrice, data.discount)}` : `₱${minPrice} - ₱${maxPrice}`;
      }
      return minMaxPrice;
    } else {
      return discounted ?  `₱${this.getDiscountedPrice(data.price, data.discount)}` : `₱${data.price}` 
    }
  }
  
  getDiscountedPrice(price:any, discount:number){
    if(discount && discount > 0)
      return Number((Number(price) - (Number(price) * (discount/100))).toFixed(2));
    else return price;
  }

  getTotalItemsInCart(): number {
    return this.products.length;
  }

  async deleteItem(product: any) {
    const index = this.products.indexOf(product);
    if (index > -1) {
      this.products.splice(index, 1);
    }

    const cartRef = ref(this.db, `/favorites/${this.clientId}`);
    const productRef = child(cartRef, product.cartId);

    try {
      // Wait for the removal operation to complete
      await remove(productRef);
      console.log('Item removed from the database');
    } catch (error) {
      console.error('Error removing item from the database', error);
    }
  }

  capitalize(str: any): string {
    if (typeof str !== 'string') {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  goToProd(product:any){
    const index = this.products.indexOf(product);
    this.productService.goToProductDetails(product.productData,product.shopData)
  }
  
  goToCart(){
    this.router.navigateByUrl('/view-cart')
  }
  
}
