import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Database , ref , onValue , child , remove , update } from '@angular/fire/database';
import { NavigationExtras, Router } from '@angular/router';
import { AlertController, IonCheckbox, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DataqueriesService } from 'src/app/services/dataqueries.service';

@Component({
  selector: 'app-view-cart',
  templateUrl: './view-cart.component.html',
  styleUrls: ['./view-cart.component.scss'],
  standalone: true,
  imports:[IonicModule,CommonModule,]
})
export class ViewCartComponent  implements OnInit {

  clientId = JSON.parse(localStorage.getItem('userData')!).id;
  cartRef = ref(this.db, `/cart/${this.clientId}`);
  shopData:any =  JSON.parse(localStorage.getItem('shopId')!);
  prodRef = ref(this.db, `/products/${this.shopData.id}`);
  cartData:any

  products: any[] = []

  constructor(private alertController : AlertController,
              private db              : Database,
              private cdRef           : ChangeDetectorRef,
              private router          : Router,
              private dq              : DataqueriesService) { }

  ngOnInit() {
    

      onValue(this.cartRef, async (snapshot) => {
        this.cartData = snapshot.val();
        if (this.cartData) {
          for (const key in this.cartData) {
            if (this.cartData.hasOwnProperty(key)) {
              const cartValue = this.cartData[key]
              const existingProductIndex = this.products.findIndex(product => product.cartId === key);
              const product = await firstValueFrom(this.dq.getProductById(cartValue.productId, this.shopData.id))
              if(product == null){
                continue;
              }
              if(existingProductIndex !== -1){
                this.products[existingProductIndex].quantity = cartValue.quantity;
              } else {   
                if(cartValue.variants){
                  const data = {
                    cartId : key,
                    productId : cartValue.productId,
                    shopId : cartValue.shopId,
                    name : cartValue.name,
                    quantity : cartValue.quantity,
                    stocks : this.getStocks(product, cartValue.variants),
                    discount : product.discount,
                    realprice:cartValue.price,
                    price : this.getDiscountedPrice(cartValue.price, product.discount),
                    images : cartValue.image.imageRef,
                    variants : cartValue.variants,
                    selected : false
                  }
                  this.products.push(data)
                } else {
                  const data = {
                    cartId : key,
                    productId : cartValue.productId,
                    shopId : cartValue.shopId,
                    name : cartValue.name,
                    quantity : cartValue.quantity,
                    stocks : this.getStocks(product, cartValue.variants),
                    discount : product.discount,
                    realprice: cartValue.price,
                    price : this.getDiscountedPrice(cartValue.price, product.discount),
                    images : cartValue.image.imageRef,
                    selected : false
                  }
                  this.products.push(data)
                }
              }
            }
          }
        }
  
        this.cdRef.detectChanges();
      });
    onValue(this.prodRef, async()=>{
        for(let product of this.products){
          const prod = await firstValueFrom(this.dq.getProductById(product.productId, this.shopData.id))
          product.stocks = this.getStocks(prod, product.variants)
          product.price = this.getDiscountedPrice(product.realprice, prod.discount),
          product.discount = prod.discount
        }
        this.cdRef.detectChanges();
    })

  }  

  getStocks(product:any, ref:any){
    if(product.variants){
      if(product.variants.size){
        return product.variants.size[ref[0].variantIndex].in_stock;
      }else{
        return product.variants.colors[ref[0].variantIndex].types[ref[1].variantIndex].in_stock;
      }
    }else{
      return product.in_stock;
    }
  }

  getTotalItemsInCart(): number {
    return this.products.length;
  }

  async clearCart(): Promise<void> {
    const alert = await this.alertController.create({
        header: 'Confirmation',
        message: 'Are you sure you want to clear your cart?',
        buttons: [
            {
                text: 'Cancel',
                role: 'cancel',
                cssClass: 'secondary',
                handler: () => {
                    // Do nothing if the user cancels
                }
            },
            {
                text: 'OK',
                handler: () => {
                    this.products = [];

                    const cartRef = ref(this.db, `/cart`);
                    const id = child(cartRef, this.clientId);
                    remove(id);

                    // Notify the user that the cart has been cleared
                    this.showAlert('Success', 'Your cart has been cleared!');
                }
            }
        ]
    });

    // Present the alert to the user
    await alert.present();
}

getDiscountedPrice(price:any, discount:number){
  if(discount && discount > 0)
    return Number((Number(price) - (Number(price) * (discount/100))).toFixed(2));
  else return price;
}

async showAlert(header: string, message: string): Promise<void> {
  const alert = await this.alertController.create({
      header: header,
      message: message,
  });

  await alert.present();

  setTimeout(() => {
      alert.dismiss();
  }, 1500);
}

  async deleteItem(product: any) {
    const index = this.products.indexOf(product);
    if (index > -1) {
      this.products.splice(index, 1);
    }

    const cartRef = ref(this.db, `/cart/${this.clientId}`);
    const productRef = child(cartRef, product.cartId);

    try {
      // Wait for the removal operation to complete
      await remove(productRef);
      console.log('Item removed from the database');
    } catch (error) {
      console.error('Error removing item from the database', error);
    }
  }

  decreaseQuantity(product: any): void {
    if (product.quantity > 1) {
      product.quantity--;
      this.updateQuantityInDatabase(product);
    }
  }
  
  increaseQuantity(product: any): void {
    if(product.quantity < product.stocks){
      product.quantity++;
      this.updateQuantityInDatabase(product);
    }
  }

  updateQuantityInDatabase(product: any): void {
    const productPath = `${product.cartId}/quantity`;
    const updates :any = {};
    updates[productPath] = product.quantity;
  
    update(this.cartRef, updates)
      .then(() => {
        console.log('Quantity updated in the database');
      })
      .catch((error) => {
        console.error('Error updating quantity:', error);
      });
  }
  
  calculateTotalCost(){
    const selectedProducts = this.products.filter((product) => product.selected && product.stocks > 0);

    return selectedProducts.reduce((total, product) => total + (product.price * product.quantity), 0);
  }  

  atLeastOneItemSelected(): boolean {
    return this.products.some((product) => product.selected && product.stocks > 0);
  }

  openCheckoutSummary() {
    const selectedProducts = this.products.filter((product) => product.selected && product.stocks > 0);
    this.dq.getCheckOutProducts(selectedProducts);
    this.router.navigateByUrl('/check-out');
  }

  addToProductsSelected(index:any){
    this.products[index].selected = true
  }
  
  
  generateSummary(selectedProducts: any[]): string {
    let summary = '';
    selectedProducts.forEach((product) => {
      summary += `
        <ion-thumbnail slot="start">
          <img src="${product.images}" alt="${product.name}">
        </ion-thumbnail>
        <ion-label>
          <h2>${product.name}</h2>
          <p>Price: $${product.price}</p>
        </ion-label>
        <br>
      `;
    });
  
    return summary;
  }

  capitalize(str: any): string {
    if (typeof str !== 'string') {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  

}
