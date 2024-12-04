import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Database , ref , onValue , child , remove , update } from '@angular/fire/database';
import { NavigationExtras, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DataqueriesService } from 'src/app/services/dataqueries.service';

@Component({
  selector: 'app-carts',
  templateUrl: './carts.page.html',
  styleUrls: ['./carts.page.scss'],
})
export class CartsPage implements OnInit {
  clientId = JSON.parse(localStorage.getItem('userData')!).id;
  cartRef = ref(this.db, `/cart/${this.clientId}`);
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
                  stocks : cartValue.stocks,
                  discount: cartValue.discount,
                  price : cartValue.price,
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
                  stocks : cartValue.stocks,
                  discount: cartValue.discount,
                  price : cartValue.price,
                  images : cartValue.image.imageRef,
                  selected : false
                }
                this.products.push(data)
              }
            }
          }
        }
      }

    });

    this.cdRef.detectChanges();

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
    if(product.quantity != product.stocks){
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
    const selectedProducts = this.products.filter((product) => product.selected);

    return selectedProducts.reduce((total, product) => total + (product.price * product.quantity), 0);
  }  

  atLeastOneItemSelected(): boolean {
    return this.products.some((product) => product.selected);
  }

  openCheckoutSummary() {
    const selectedProducts = this.products.filter((product) => product.selected);
    this.dq.getCheckOutProducts(selectedProducts);
    this.router.navigateByUrl('/check-out');
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
  
  getDiscountedPrice(price:any, discount?:number){
    if(discount)
      return Number((Number(price) - (Number(price) * (discount/100))).toFixed(2));
    else return price;
  }

}



// import { AfterViewInit, ChangeDetectionStrategy, Component, OnChanges, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { AlertController } from '@ionic/angular';
// import { BehaviorSubject, Observable, ReplaySubject, combineLatest, firstValueFrom, map, switchMap, take, tap } from 'rxjs';
// import { DataqueriesService } from 'src/app/services/dataqueries.service';
// import { OrderService } from 'src/app/services/order.service';
// import { ProductService } from 'src/app/services/product.service';

// @Component({
//   selector: 'app-product-details',
//   templateUrl: './product-details.page.html',
//   styleUrls: ['./product-details.page.scss'],
//   encapsulation: ViewEncapsulation.None,
//   changeDetection:ChangeDetectionStrategy.OnPush
// })
// export class ProductDetailsPage implements OnInit, AfterViewInit{
//   @ViewChild('suggestionSwiper') suggestionSwiper!:HTMLElement
//   @ViewChild('variantSwiper')    variantSwiper   ?:HTMLElement

//   productDetails$ = this.productService.productDetails$

//   variantData: any[] = [];
//   selectVar = false;
//   selectedVariants: any[] = [];
//   private variantDataMap: { [key: string]: any[] } = {};

//   suggestions$ =  this.productDetails$.pipe(
//     switchMap((productDetail)=>
//       this.productService.completeProducts$.pipe(
//         take(1),
//         map((completeProducts)=>{
//           const filtered =  completeProducts[1].filter((products:any)=>products.category === productDetail.category && products.id !== productDetail.id)
//           let retProd:any[] = [];
//           if(filtered.length > 0){
//             retProd = [...pickUniqueNumbers(filtered.length).map((randInd)=>filtered[randInd-1])]
//             if(retProd.length < 5){
//               for(let toComp = retProd.length - 5 ; toComp < 5 ; toComp++){
//                 let gotProd = completeProducts[1][getRandomNumber(completeProducts.length)]
//                 if(retProd.findIndex((ret:any)=>ret.id === gotProd.id) < 0){
//                   retProd.push(gotProd)
//                 }
//                 else{
//                   toComp = toComp - 1
//                 }
//               }
//             }
//           }
//           else{
//             retProd = [...pickUniqueNumbers(completeProducts[1].length).map((randInd)=>completeProducts[1][randInd-1])]
//           }
//           return retProd
//         })
//       )
//     ),
//     tap((fetched)=>{
//       console.log('productDetail',fetched);
//     }),
//   )
//   currentOrder$   = this.orderService.currentOrder$
//   variantIndex$   = new BehaviorSubject<number>(0)
//   variantIndex!: number

//   inCart$!:Observable<boolean>

//   ratings$:Observable<any> = this.productDetails$.pipe(
//     switchMap((productDetails:any)=>
//       this.dataQueries.getProductReviews(productDetails.id)
//     ),
//     switchMap((reviews:any)=>
//     combineLatest(reviews.map((review:any)=>
//     this.dataQueries.getUserById(review.clientId).pipe(
//       map((clientData:any)=> {
//         return {
//           ...review,
//           clientData: clientData
//         }
//       })
//      ))
//     )
//     )
//   )

//   images:string[] = [];
//   varIndex : number = 0;

//   constructor(private productService : ProductService,
//               private dataQueries    : DataqueriesService,
//               private orderService   : OrderService,
//               private alertController: AlertController,
//               private actRoute       : ActivatedRoute) { }


//   ngOnInit() {
    
//     this.variantIndex$.subscribe({
//       next:(index)=>{
//         this.variantIndex = index
//       }
//     })

//     this.actRoute.queryParams.subscribe((params) => {
//       if(params?.['variantIndex'] > 0){
//         this.variantIndex$.next(parseInt(params?.['variantIndex']))
//       }

//     });



//     this.inCart$ = combineLatest([
//       this.productDetails$,
//       this.currentOrder$  ,
//       this.variantIndex$  ,
//     ]).pipe(
//       map((detailsData)=>{
//         const productDetails = detailsData[0]
//         const currentOrder   = detailsData[1]
//         const variantIndex   = detailsData[2]
//         if(currentOrder === null || currentOrder?.status < 0 || currentOrder?.status >= 3 ) return false
//         else{
//           const foundItem = currentOrder.items.find((item:any)=>item.productId === productDetails.id)
//           if(foundItem){
//             if(foundItem.variants)return foundItem.variants.some((variant: any)=>{
//               console.log('VARIAAAANT', variant)
//               variant.variantIndex === variantIndex
//             })
//             else return true
//           }
//           else return false
//         }
//       })
//     )
//     // this.ratings$.subscribe(see=>console.log("subscribe",see))

//   }


//   ngAfterViewInit(){
//     console.log("suggestionSwiper",this.suggestionSwiper);
//     console.log("variantSwiper",this.variantSwiper);
//   }


//   async addToCart(){
//     const cartData = await firstValueFrom(combineLatest([
//       this.currentOrder$,
//       this.productDetails$,
//       this.productService.shopData$,
//       this.variantIndex$
//     ]))

//     const currOrder    = cartData[0]
//     const prodDetails  = cartData[1]
//     const shopData     = cartData[2]
//     const variantIndex = cartData[3]

//     if(currOrder === null || currOrder.status >= 3 || currOrder.status < 0 ){
//       let orderData
//       if(prodDetails.variants){
//         orderData = {
//           clientId  : JSON.parse(localStorage.getItem('userData')!).id,
//           createdAt : new Date().getTime(),
//           timestamp : new Date().getTime(),
//           items     :
//           [{
//             productId:prodDetails.id,
//             variants: [{
//               variantIndex: variantIndex,
//               price: prodDetails.variants[variantIndex].price,
//               quantity: 1,
//             }]
//           }],
//           storeId   : shopData.id,
//           status    : 0,
//         }
//       }
//       else{
//         orderData = {
//           clientId  : JSON.parse(localStorage.getItem('userData')!).id,
//           createdAt : new Date().getTime(),
//           timestamp : new Date().getTime(),
//           items     :
//           [{
//             productId:prodDetails.id,
//             price: prodDetails.price,
//             quantity: 1
//           }],
//           storeId   : shopData.id,
//           status    : 0,
//         }
//       }
//       this.dataQueries.addOrder(orderData)
//     }
//     else{
//       let toEdit = currOrder
//       const itemIndex =  currOrder.items.findIndex((item:any)=>item.productId === prodDetails.id)

//       if(itemIndex >= 0){
//         toEdit.items[itemIndex].variants.push({
//           variantIndex: variantIndex,
//           price: prodDetails.variants[variantIndex].price,
//           quantity: 1,
//         })
//       }
//       else{
//         if(prodDetails.variants){
//           toEdit.items.push({
//             productId:prodDetails.id,
//             variants: [{
//               variantIndex: variantIndex,
//               price: prodDetails.variants[variantIndex].price,
//               quantity: 1,
//             }]
//           })
//         }
//         else{
//           toEdit.items.push({
//             productId:prodDetails.id,
//             price: prodDetails.price,
//             quantity: 1
//           })
//         }
//       }
//       console.log(toEdit);

//      this.dataQueries.updateOrder(toEdit)
//     }
//   }

//   async quantityOperation(operation: 1 | -1, currentOrder:any, productDetails:any){

//     const clonedOrder = structuredClone(currentOrder)
//     const clonedItem = clonedOrder.items.find((item:any)=>item.productId === productDetails.id)

//     if(productDetails.variants){
//       const index  = await firstValueFrom(this.variantIndex$)
//       const quantity = clonedItem.variants.find((variant:any)=> variant.variantIndex === index).quantity + operation
//       if(quantity){
//         clonedOrder.items.forEach((item:any)=>{
//           delete item.productDetails
//         })
//         clonedItem.variants.find((variant:any)=> variant.variantIndex === index).quantity = quantity
//         this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
//       }
//       else{
//         const alert = await this.alertController.create({
//           header: "Are you sure?",
//           message: `This will remove the item from your cart`,
//           buttons:[
//             {
//               text:"Cancel",
//               role:'cancel'},
//             {
//               text:"Okay",
//               role:'ok'
//             }]
//         })
//         alert.present();
//         if((await alert.onWillDismiss()).role === 'ok'){
//           // clonedItem.variants.splice(index,1)
//           clonedItem.variants = clonedItem.variants.filter((variant:any)=>variant.variantIndex !== index)

//           if(clonedItem.variants.length === 0){
//             clonedOrder.items = clonedOrder.items.filter((item:any)=> item.productId !== productDetails.id)
//             if(clonedOrder.items.length === 0){
//               this.dataQueries.deleteOrder(clonedOrder.id)
//             }
//             else{
//               this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
//             }
//           }
//           else{
//             this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
//           }
//         }

//       }
//     }
//     else{
//       const quantity = clonedItem.quantity + operation
//       if(quantity){
//         clonedItem.quantity = quantity
//         this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
//       }
//       else{
//         const alert = await this.alertController.create({
//           header: "Are you sure?",
//           message: `This will remove the item from your cart`,
//           buttons:[
//             {
//               text:"Cancel",
//               role:'cancel'},
//             {
//               text:"Okay",
//               role:'ok'
//             }]
//         })
//         alert.present();
//         if((await alert.onWillDismiss()).role === 'ok'){
//           clonedOrder.items = clonedOrder.items.filter((item:any)=>item.productId !== productDetails.id)
//           if(clonedOrder.items.length === 0){
//             this.dataQueries.deleteOrder(clonedOrder.id)
//           }
//           else{
//             this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
//           }
//         }
//       }

//     }

//   }

//   disableAddButtons(currentOrder:any, productDetails:any, index: any){
//     const item = currentOrder.items.find((item:any)=>item.productId === productDetails.id)
//     if(item){
//       if(productDetails.variants){
//         const quantity = item?.variants.find((variant:any)=> variant.variantIndex === index)?.quantity
//         return productDetails.in_stock <= quantity
//       }
//       else{
//         return productDetails.in_stock <= item.quantity
//       }
//     }
//     else return false
//   }

//   getCurrentNumber(currentOrder:any, productDetails:any, index: any){
//     if(currentOrder){
//       const item = currentOrder.items.find((item:any)=>item.productId == productDetails.id)
//       if(item){
//         if(item.variants){
//           return item.variants.find((variant:any)=> variant.variantIndex === index)?.quantity
//         }
//         else{
//           return item.quantity
//         }
//       }
//     }


//   }

//   clickedVariant(index:number){
//     this.variantIndex$.next(index)
//   }

//   openCart(){
//     this.orderService.openCart()
//   }

//   async goToProductDetails(prod:any){
//     const shopData = (await firstValueFrom(this.productService.completeProducts$.pipe(
//       map((prods: any[])=>prods[0])
//     )))

//     this.productService.goToProductDetails(prod,shopData)
//   }

//   getImages(prod: any) {

//     let variants: any[] = []
    
//     if (prod.variants) {
//       for ( const keys in prod.variants) {
//         if (prod.variants.hasOwnProperty(keys)) {
//           const value = prod.variants[keys];
          
//           if (Array.isArray(value)) {
//             value.forEach((variant: any) => {
//               if (variant.image && Array.isArray(variant.image)) {
//                 variant.image.map((img: any) =>{
//                   this.images.push(img.imageRef)
//                 })
//               }
//             });
//           }
//         }
//       }
//     } else {
//       return prod.images
//     }
//     return this.images;
//   }

//   getFirstImageRef(productItem:any) {
//     let firstKey: string | undefined;

//     if (productItem.variants) {
//       for (const key in productItem.variants) {
//           if (productItem.variants.hasOwnProperty(key)) {
//               firstKey = key;
//               break;
//           }
//       }
//     }

//     if (firstKey) {
//       return productItem.variants[firstKey][0].image[0].imageRef;
//     } else{
//         return productItem.images[0].imageRef;
//     }
//   }

//   getVariants(key: any, got: any): any[] {
//     if (this.variantDataMap[key] && this.variantDataMap[key].length > 0) {
//       return this.variantDataMap[key];
//     }
  
//     const items = got;
//     const variantData: any[] = [];
  
//     items.forEach((item: any) => {
//       const imagy: string[] = [];
  
//       if (Array.isArray(item.image)) {
//         item.image.forEach((img: any) => {
//           imagy.push(img.imageRef);
//         });
//       }
  
//       const data = {
//         name: item.variant_name,
//         price: item.price,
//         stocks: item.in_stock,
//         image: imagy,
//       };
  
//       variantData.push(data);
//     });
  
//     this.variantDataMap[key] = variantData;
//     console.log(variantData)
//     return variantData;
//   }

//   sampleQuery() {
//     this.productDetails$.subscribe(data => {
//       if (data.variants) {
//         const allVariants = [];
//         for (const variantType in data.variants) {
//           if (Array.isArray(data.variants[variantType])) {
//             allVariants.push(...data.variants[variantType]);
//           }
//         }
//         console.log(allVariants);
//       }
//     });
//   }
  
  
  

//   selectedVariant(key: number, item: any) {
//     const index = this.selectedVariants.findIndex((selectedItem) => selectedItem.key === key);
  
//     if (index !== -1) {
//       // Key already exists, replace the item.name
//       this.selectedVariants[index].name = item.name;
//     } else {
//       // Key does not exist, add a new item
//       this.selectedVariants.push({ key, name: item.name });
//     }
//   }

//   isItemSelected(item: any): boolean {
//     return this.selectedVariants.some(selectedItem => selectedItem.name === item.name);
//   }
  
// }


// function pickUniqueNumbers(arrayLength: number){
//   const k = arrayLength < 5 ? arrayLength : 5
//   const shuffledNumbers = Array.from({ length: arrayLength + 1 }, (_, index) => index).slice(1).sort(() => Math.random() - 0.5);
//   return shuffledNumbers.slice(0, k);
// }

// function getRandomNumber(n:number) {
//   return Math.floor(Math.random() * (n + 1));
// }



