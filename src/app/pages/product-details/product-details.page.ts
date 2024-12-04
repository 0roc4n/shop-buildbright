import { AfterViewInit, ChangeDetectionStrategy, Component, OnChanges, OnInit, ViewChild, ViewEncapsulation, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonSlide } from '@ionic/angular';
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, firstValueFrom, map, switchMap, take, tap } from 'rxjs';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { OrderService } from 'src/app/services/order.service';
import { ProductService } from 'src/app/services/product.service';
import { Database, ref, push, child, remove, onValue } from '@angular/fire/database';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.page.html',
  styleUrls: ['./product-details.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class ProductDetailsPage implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild('suggestionSwiper') suggestionSwiper!:HTMLElement
  @ViewChild('variantSwiper')    variantSwiper   ?:HTMLElement

  @Input() shopData!:any
  addBulk:boolean = false;
  bulkMode$ = new BehaviorSubject<boolean>(false)
  clientID = JSON.parse(localStorage.getItem('userData')!).id
  quantity: number = 1;
  reviews: number = 0;
  // favorite=false;
  selectedImage: { vIndex: number, imgIndex: number } | undefined;
  variantData: any[] = [];
  selectVar = false;
  selectedVariants: any[] = [];
  price:any
  stocks:any
  favoriteRef = ref(this.db, `/favorites/${this.clientID}`);
  faveData : any
  // itemName : any
  // fbKey:any
  shopDatas = JSON.parse(localStorage.getItem('shopId')!)
  suggestion:any[] = []



  productDetails$ = this.productService.productDetails$

  suggestions$ =  this.productDetails$.pipe(
    switchMap((productDetail)=>
      this.productService.completeProducts$.pipe(
        take(1),
        map((completeProducts)=>{
          const filtered =  completeProducts[1].filter((products:any)=>products.category === productDetail.category && products.id !== productDetail.id)
          let retProd:any[] = [];
          if(filtered.length > 0){
            retProd = [...pickUniqueNumbers(filtered.length).map((randInd)=>filtered[randInd-1])]
            if(retProd.length < 5){
              for(let toComp = retProd.length - 5 ; toComp < 5 ; toComp++){
                let gotProd = completeProducts[1][getRandomNumber(completeProducts.length)]
                if(retProd.findIndex((ret:any)=>ret.id === gotProd.id) < 0){
                  retProd.push(gotProd)
                }
                else{
                  toComp = toComp - 1
                }
              }
            }
          }
          else{
            retProd = [...pickUniqueNumbers(completeProducts[1].length).map((randInd)=>completeProducts[1][randInd-1])]
          }
          return retProd
        })
      )
    ),
    tap((fetched)=>{
      console.log('productDetail',fetched);
    }),
  )
  
  currentOrder$   = this.orderService.currentOrder$
  variantIndex$   = new BehaviorSubject<number>(0)
  variantIndex!: number

  inCart$!:Observable<boolean>
  

  ratings$:Observable<any> = new Observable<any>();

  ngOnDestroy(): void {
    // console.log('Destroyed');
  }

  allVariant:any[] = []
  clicked = false;

  constructor(public productService : ProductService,
              private dataQueries    : DataqueriesService,
              private orderService   : OrderService,
              private alertController: AlertController,
              private actRoute       : ActivatedRoute,
              private router        : Router,
              private db            : Database,
              private cdRef           : ChangeDetectorRef,) { }


  ngOnInit() {
    this.getData();
    this.ratings$ =this.productService.productDetails$.pipe(
      switchMap((productDetails:any)=>
        this.dataQueries.getProductReviews(productDetails.id)
      ),
      switchMap((reviews:any)=>
      combineLatest(reviews.map((review:any)=>
      this.dataQueries.getUserById(review.clientId).pipe(
        map((clientData:any)=> {
          return {
            ...review,
            clientData: clientData
          }
        })
       ))
      )
      )
    )
     this.cdRef.detectChanges();

    // this.variantIndex$.subscribe({
    //   next:(index)=>{
    //     this.variantIndex = index
    //   }
    // })
    this.actRoute.queryParams.subscribe((params) => {
      // if(params?.['variantIndex'] > 0){
      //   this.variantIndex$.next(parseInt(params?.['variantIndex']))
      // }
      if(params?.['bulk'] == 'true'){
        this.addBulk = true;

      }
       this.cdRef.detectChanges();
    });
    



    this.inCart$ = combineLatest([
      this.productDetails$,
      this.currentOrder$  ,
      this.variantIndex$  ,
    ]).pipe(
      map((detailsData)=>{
        const productDetails = detailsData[0]
        const currentOrder   = detailsData[1]
        const variantIndex   = detailsData[2]
        if(currentOrder === null || currentOrder?.status < 0 || currentOrder?.status >= 3 ) return false
        else{
          const foundItem = currentOrder.items.find((item:any)=>item.productId === productDetails.id)
          if(foundItem){
            if(foundItem.variants)return foundItem.variants.some((variant: any)=>{
              variant.variantIndex === variantIndex
            })
            else return true
          }
          else return false
        }
      })
    )
    // this.ratings$.subscribe(see=>console.log("subscribe",see))

    this.productService.shopData$.subscribe((data) => {
      this.shopData = data;
    });

    this.cdRef.detectChanges();
  }
  favorites:any[] = []
  getData(){
    let prodDits:any
    this.productDetails$.subscribe((data)=>{
      prodDits = data
      // console.log('PRODUCT DETAILS FOR THE SHIT',prodDits)
    })

    if(this.favoriteRef){
  
      onValue(this.favoriteRef, (snapshot) => {
        this.favorites = [];
        this.faveData = snapshot.val();
        if (this.faveData) {
          for (const key in this.faveData) {
            if (this.faveData.hasOwnProperty(key)) {
              const val= this.faveData[key]
              // const mapp = val.map((data:any) => data.productId === prodDits.id)
              // if(val.productData.id === prodDits.id){
              //   this.favorite = val.state
              //   this.itemName = val.name
              //   this.fbKey = key
              // }
              this.favorites.push({
               id: val.productData.id ,
               fbKey: key
              })
              // console.log(this.favorites)
            }
          }
        }        
        this.cdRef.detectChanges();
      });
    }
  }

  checkIfFavorite(productID:string){
    const fav = this.favorites.find(favs=>{
      return favs.id == productID
    })
    return fav;
  }


  options = {
    pagination: {
      el: '.swiper-pagination',
      dynamicBullets: true,
    },
  }
  ngAfterViewInit(){

    // console.log("suggestionSwiper",this.suggestionSwiper);
    // console.log("variantSwiper",this.variantSwiper);
  }


  // async addToCart(){
  //   const cartData = await firstValueFrom(combineLatest([
  //     this.currentOrder$,
  //     this.productDetails$,
  //     this.productService.shopData$,
  //     this.variantIndex$
  //   ]))

  //   const currOrder    = cartData[0]
  //   const prodDetails  = cartData[1]
  //   const shopData     = cartData[2]
  //   const variantIndex = cartData[3]

  //   if(currOrder === null || currOrder.status >= 3 || currOrder.status < 0 ){
  //     let orderData
  //     if(prodDetails.variants){
  //       orderData = {
  //         clientId  : JSON.parse(localStorage.getItem('userData')!).id,
  //         createdAt : new Date().getTime(),
  //         timestamp : new Date().getTime(),
  //         items     :
  //         [{
  //           productId:prodDetails.id,
  //           variants: [{
  //             variantIndex: variantIndex,
  //             price: prodDetails.variants[variantIndex].price,
  //             quantity: 1,
  //           }]
  //         }],
  //         storeId   : shopData.id,
  //         status    : 0,
  //       }
  //     }
  //     else{
  //       orderData = {
  //         clientId  : JSON.parse(localStorage.getItem('userData')!).id,
  //         createdAt : new Date().getTime(),
  //         timestamp : new Date().getTime(),
  //         items     :
  //         [{
  //           productId:prodDetails.id,
  //           price:prodDetails.price, 
  //           quantity: 1
  //         }],
  //         storeId   : shopData.id,
  //         status    : 0,
  //       }
  //     }
  //     this.dataQueries.addOrder(orderData)
  //   }
  //   else{
  //     let toEdit = currOrder
  //     const itemIndex =  currOrder.items.findIndex((item:any)=>item.productId === prodDetails.id)

  //     if(itemIndex >= 0){
  //       toEdit.items[itemIndex].variants.push({
  //         variantIndex: variantIndex,
  //         discount  : prodDetails.discount,
  //         price: prodDetails.variants[variantIndex].price,
  //         quantity: 1,
  //       })
  //     }
  //     else{
  //       if(prodDetails.variants){
  //         toEdit.items.push({
  //           productId:prodDetails.id,
  //           variants: [{
  //             variantIndex: variantIndex,
  //             discount  : prodDetails.discount,
  //             price: prodDetails.variants[variantIndex].price,
  //             quantity: 1,
  //           }]
  //         })
  //       }
  //       else{
  //         toEdit.items.push({
  //           productId:prodDetails.id,
  //           discount  : prodDetails.discount,
  //           price: prodDetails.price, 
  //           quantity: 1
  //         })
  //       }
  //     }
  //     console.log(toEdit);

  //    this.dataQueries.updateOrder(toEdit)
  //   }
  // }

  // async quantityOperation(operation: 1 | -1, currentOrder:any, productDetails:any){

  //   const clonedOrder = structuredClone(currentOrder)
  //   const clonedItem = clonedOrder.items.find((item:any)=>item.productId === productDetails.id)

  //   if(productDetails.variants){
  //     const index  = await firstValueFrom(this.variantIndex$)
  //     const quantity = clonedItem.variants.find((variant:any)=> variant.variantIndex === index).quantity + operation
  //     if(quantity){
  //       clonedOrder.items.forEach((item:any)=>{
  //         delete item.productDetails
  //       })
  //       clonedItem.variants.find((variant:any)=> variant.variantIndex === index).quantity = quantity
  //       this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //     }
  //     else{
  //       const alert = await this.alertController.create({
  //         header: "Are you sure?",
  //         message: `This will remove the item from your cart`,
  //         buttons:[
  //           {
  //             text:"Cancel",
  //             role:'cancel'},
  //           {
  //             text:"Okay",
  //             role:'ok'
  //           }]
  //       })
  //       alert.present();
  //       if((await alert.onWillDismiss()).role === 'ok'){
  //         // clonedItem.variants.splice(index,1)
  //         clonedItem.variants = clonedItem.variants.filter((variant:any)=>variant.variantIndex !== index)

  //         if(clonedItem.variants.length === 0){
  //           clonedOrder.items = clonedOrder.items.filter((item:any)=> item.productId !== productDetails.id)
  //           if(clonedOrder.items.length === 0){
  //             this.dataQueries.deleteOrder(clonedOrder.id)
  //           }
  //           else{
  //             this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //           }
  //         }
  //         else{
  //           this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //         }
  //       }

  //     }
  //   }
  //   else{
  //     const quantity = clonedItem.quantity + operation
  //     if(quantity){
  //       clonedItem.quantity = quantity
  //       this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //     }
  //     else{
  //       const alert = await this.alertController.create({
  //         header: "Are you sure?",
  //         message: `This will remove the item from your cart`,
  //         buttons:[
  //           {
  //             text:"Cancel",
  //             role:'cancel'},
  //           {
  //             text:"Okay",
  //             role:'ok'
  //           }]
  //       })
  //       alert.present();
  //       if((await alert.onWillDismiss()).role === 'ok'){
  //         clonedOrder.items = clonedOrder.items.filter((item:any)=>item.productId !== productDetails.id)
  //         if(clonedOrder.items.length === 0){
  //           this.dataQueries.deleteOrder(clonedOrder.id)
  //         }
  //         else{
  //           this.dataQueries.updateOrderItems(clonedOrder.id,clonedOrder.items)
  //         }
  //       }
  //     }

  //   }

  // }

  disableAddButtons(currentOrder:any, productDetails:any, index: any){
    const item = currentOrder.items.find((item:any)=>item.productId === productDetails.id)
    if(item){
      if(productDetails.variants){
        const quantity = item?.variants.find((variant:any)=> variant.variantIndex === index)?.quantity
        return productDetails.in_stock <= quantity
      }
      else{
        return productDetails.in_stock <= item.quantity
      }
    }
    else return false
  }

  getCurrentNumber(currentOrder:any, productDetails:any, index: any){
    if(currentOrder){
      const item = currentOrder.items.find((item:any)=>item.productId == productDetails.id)
      if(item){
        if(item.variants){
          return item.variants.find((variant:any)=> variant.variantIndex === index)?.quantity
        }
        else{
          return item.quantity
        }
      }
    }


  }

  async goToProductDetails(prod:any){
    const shopData = (await firstValueFrom(this.productService.completeProducts$.pipe(
      map((prods: any[])=>prods[0])
    )))

    this.productService.goToProductDetails(prod,shopData)
  }

  sampleQuery(data:any) {
    let allVariants:any[] = []
    if (data.variants) {
      for (const variantType in data.variants) {
        if (Array.isArray(data.variants[variantType])) {
          allVariants.push(...data.variants[variantType]);
        }
      }
    }
    return allVariants
  }

  incrementQuantity(stock:any) {
    if(this.quantity < stock){
      this.quantity++;
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
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

  // goToProductDetailss(product:any, shopData:any){
  //   this.router.navigate(['product-details'],{
  //     onSameUrlNavigation: 'reload',
  //   })
  //   this.productDetails$.next(product)
  //   this.productService.shopData$.next(shopData)
  // }
    
  isItemSelected(item: any): boolean {
    return this.selectedVariants.some(selectedItem => selectedItem.item === item);
  }

  
  selectedVariant(variation: string, item: any, variantIndex:number) {
    

    this.quantity = 1 ;
    const index = this.selectedVariants.findIndex(selectedItem => selectedItem.variation === variation);
  
    if (index !== -1) {
      // Variation already exists, replace its item
      item.variantIndex = variantIndex;
      this.selectedVariants[index].item = item;
    } else {
      item.variantIndex = variantIndex;
      // Variation does not exist, add the new variation and item
      this.selectedVariants.push({ variation, item });
    }

  }  

  capitalize(str: any){
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  convertToArray(value: any): any[] {
    return Array.isArray(value) ? value : [value];
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
    return Number((Number(price) - (Number(price) * (discount/100))).toFixed(2));
  }

  isArray(value:any){
    return Array.isArray(value);
  }
  
  getStocks() {
    let variations:any;
    for (const variant of this.selectedVariants) {
      variations = variant.variation;
    }

    if (this.selectedVariants.length>1) {
      const index = this.selectedVariants.findIndex(selectedItem => selectedItem.variation != 'type')
      const type = this.selectedVariants.findIndex(selectedItem => selectedItem.variation == 'type');
      
      const elementAtIndex = this.selectedVariants[index];
      this.stocks = elementAtIndex.item.types[this.selectedVariants[type].item.variantIndex].in_stock;
  
      return this.stocks;
    } else {
      
      try{
        // this.stocks = this.selectedVariants.map(selectedItem => {
        //   return selectedItem.item.in_stock
        // })[0];

        this.stocks = this.selectedVariants[0].item.in_stock;
      }catch(e){
        this.stocks = null;
        // console.log('Stock error.')
      }
      return this.stocks;
    }    

  }

  getPrice() {
    let variations:any;
    for (const variant of this.selectedVariants) {
      variations = variant.variation;
    }

    if (this.selectedVariants.length>1) {
      let type:any

      if(variations === 'type'){
        const index = this.selectedVariants.findIndex(selectedItem => selectedItem.variation === variations);
        const elementAtIndex = this.selectedVariants[index];
        
        type = elementAtIndex.item.name;
      }

      if (Array.isArray(this.selectedVariants)) {
        this.selectedVariants.forEach((data, index) => {
      
          if (index === 0 && Array.isArray(data.item.types) && data.item.types.length > 0) {
            const foundVariant = data.item.types.find((variant:any) => variant.name === type);
            if (foundVariant) {
              this.price = foundVariant.price
            } else {
              console.log("variant not found in types array at index 0");
            }
          }
        });
      }
      return this.price * this.quantity;
    } else {
      const inStockArray = this.selectedVariants.map(selectedItem => {
        this.price = parseFloat(selectedItem.item.price); // Convert the item price to a number
        return !isNaN(this.price) ? this.price * this.quantity : 0; // Multiply by quantity if it's a valid number, otherwise, use 0
      });
      
      const totalPrice = inStockArray.reduce((acc, price) => acc + price, 0); // Calculate total price by summing the array
      return totalPrice;
    }
    
  }

  async sendToCart(){
    let variantName:any[] = []
    let variantImage:any;
    if(this.selectedVariants.length > 0){
      if(this.selectedVariants[0].variation == 'type'){
        this.selectedVariants.reverse();
      }
    }
    // always put type on last

    this.selectedVariants.forEach((variant:any)=>{
      variantName.push({
        variant: variant.item.variant_name?? variant.item.name,
        variantIndex : variant.item.variantIndex,
        variation:  variant.variation
      })
    })

  

    this.selectedVariants.forEach(name=>{
      if(name.variation != 'type'){
        variantImage = name.item.image[0];
        // return name.item.image
      }
    })
    // console.log('IMAGE',image)
    const cartData = await firstValueFrom(combineLatest([
      this.productDetails$,
      this.productService.shopData$,
    ]))

    const prodDetails  = cartData[0]
    const shopData     = cartData[1]
    
    let pushCart:any
    if(prodDetails.variants){
      pushCart = {
        clientId  : JSON.parse(localStorage.getItem('userData')!).id,
        shopId    : shopData.id,
        productId : prodDetails.id,
        name      : prodDetails.name,
        price     : this.price,
        stocks    : this.stocks,
        quantity  : this.quantity,
        variants  : variantName,
        image     : variantImage,
      }
    } else {
      pushCart = {
        clientId  : JSON.parse(localStorage.getItem('userData')!).id,
        shopId    : shopData.id,
        productId : prodDetails.id,
        name      : prodDetails.name,
        price     : prodDetails.price,
        stocks    : prodDetails.in_stock,
        quantity  : this.quantity,
        image     :  prodDetails.images[0],
      }

      console.log('variantImage', pushCart)  
    }
    
    try {
      await this.dataQueries.addToCart(pushCart);
      this.selectedVariants.length = 0
      this.quantity = 1
      const alert = await this.alertController.create({
        header: 'Success!',
        message: 'Item successfully added to cart!',
        buttons: [{
          text: 'Okay',
        }],
        
      });
  
      await alert.present();
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  }

  goToCart(){
    this.router.navigateByUrl('/view-cart')
  }

  async sendToFavorites(data:any){
    // this.favorite = !this.favorite
    const fav = this.checkIfFavorite(data.id);
    let firstKey
    let variantImage

    const cartData = await firstValueFrom(combineLatest([
      this.productDetails$,
      this.productService.shopData$,
    ]))

    const prodDetails  = cartData[0]
    const shopData     = cartData[1]

    const priceRange =  this.getMinMaxPrice(prodDetails)
    if (prodDetails.variants) {
      for (const key in prodDetails.variants) {
          if (prodDetails.variants.hasOwnProperty(key)) {
              firstKey = key;
              break;
          }
      }
    }

    if (firstKey) {
      variantImage = prodDetails.variants[firstKey][0].image[0];
    }
    
    if(fav){
      const removeFave = child(this.favoriteRef, fav.fbKey)
      remove(removeFave)
      this.getData();

      const alert = await this.alertController.create({
        header: 'Item is removed from favorites!',
      });

      await alert.present();

      setTimeout(() => {
        alert.dismiss();
    }, 1000);
    } else {
      let pushFave:any

      if(prodDetails.variants){
        console.log('this gets with variant')
        pushFave = {
          clientId  : this.clientID,
          shopData  : shopData,
          productData : prodDetails,
          name      : prodDetails.name,
          image     : variantImage,
          price     : priceRange,
          state     : 'true'
        }
      } else {
        console.log('this gets the non-variant')
        pushFave = {
          clientId  : this.clientID,
          shopData  : shopData,
          productData : prodDetails,
          name      : prodDetails.name,
          image     : prodDetails.images[0],
          price     : priceRange,
          state     : 'true'
        }
      }
    
      try {
          const cartRef = ref(this.db, `/favorites/${this.clientID}`);
          push(cartRef, pushFave);

          const alert = await this.alertController.create({
            header: 'Item is added to favorites!',
          });

          await alert.present();
          
          setTimeout(() => {
            alert.dismiss();
          }, 1000);
      } catch (error) {
        console.error('Error adding item to cart:', error);
      }
    }
  }

  goToProd(product:any){
    this.suggestion.length = 0
    this.productService.goToProductDetails(product,this.shopDatas, this.addBulk)
    this.ratings$ =this.productService.productDetails$.pipe(
      switchMap((productDetails:any)=>
        this.dataQueries.getProductReviews(product.id)
      ),
      switchMap((reviews:any)=>
      combineLatest(reviews.map((review:any)=>
      this.dataQueries.getUserById(review.clientId).pipe(
        map((clientData:any)=> {
          return {
            ...review,
            clientData: clientData
          }
        })
       ))
      )
      ),

    )
        this.getData();
     this.cdRef.detectChanges();
    this.selectedVariants = []
  }

  willBlank = false;
  
  removeBaseName(variant:string, base:string){
    if(this.willBlank){
      return variant;
    }

    if(variant.replace(base,'').trim()==''){
      this.willBlank = true;
      return variant;
    }else{
      return variant.replace(base,'').replace(' '+base, '').trim();
    }
  }


  getByCat(cat:any){
    this.suggestion = []
    const prodRef = ref(this.db, `/products/${this.shopDatas.id}`)
    let prod;
    onValue(prodRef, (snapshot) => {
      prod = snapshot.val();

      if (prod) {
        for (const key in prod) {
          if (prod.hasOwnProperty(key)) {
            const val= prod[key]
            val.id = key;
            if (val.category && val.category === cat) {
              
              this.suggestion.push(val)
            }
          }
        }
      }        
    });
    return this.suggestion
  }


  async buyNow(){
    let variantName:any[] = []
    let variantImage:any

    if(this.selectedVariants.length > 0){
      if(this.selectedVariants[0].variation == 'type'){
        this.selectedVariants.reverse();
      }
    }

    this.selectedVariants.forEach((variant:any)=>{
      variantName.push({
        variant: variant.item.variant_name?? variant.item.name,
        variantIndex : variant.item.variantIndex,
        variation:  variant.variation
      })
    })

      //variant image
      // const image=this.selectedVariants.map(name=>name.item.image)
      this.selectedVariants.forEach(name=>{
        if(name.variation != 'type'){
          variantImage = name.item.image[0];
          // return name.item.image
        }
      })

    const cartData = await firstValueFrom(combineLatest([
      this.productDetails$,
      this.productService.shopData$,
    ]))

    const prodDetails  = cartData[0]
    const shopData     = cartData[1]

    let pushCart:any
    let pass:any[]=[]

    if(prodDetails.variants){
      pushCart = {
        clientId  : JSON.parse(localStorage.getItem('userData')!).id,
        shopId    : shopData.id,
        productId : prodDetails.id,
        name      : prodDetails.name,
        price     : prodDetails.discount? this.getDiscountedPrice(this.price, prodDetails.discount) :this.price,
        stocks    : this.stocks,
        quantity  : this.quantity,
        variants  : variantName,
        images     : variantImage.imageRef,
      }
    } else {
      pushCart = {
        clientId  : JSON.parse(localStorage.getItem('userData')!).id,
        shopId    : shopData.id,
        productId : prodDetails.id,
        name      : prodDetails.name,
        price     : prodDetails.discount? this.getDiscountedPrice(prodDetails.price, prodDetails.discount) : prodDetails.price,
        stocks    : prodDetails.in_stock,
        quantity  : this.quantity,
        images     : prodDetails.images[0].imageRef,
        // image     : prodDetails.images[0],
      }
    }

    console.log(pushCart)

    pass.push(pushCart)
    
    try {
      this.dataQueries.getCheckOutProducts(pass);
      this.router.navigateByUrl('/check-out');
      this.selectedVariants.length = 0
      this.quantity = 1
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  }
  
  checkVariants(productDetails:any){
    var productVariantsLength =  productDetails.variants.colors ? 2 : 1 ;
    // console.log(productVariantsLength, this.selectedVariants.length)
    return productVariantsLength <= this.selectedVariants.length && this.getStocks() > 0;
  }





  async addToBulk(){
    let variantName:any[] = []
    let variantImage:any;
    if(this.selectedVariants.length > 0){
      if(this.selectedVariants[0].variation == 'type'){
        this.selectedVariants.reverse();
      }
    }
    // always put type on last

    this.selectedVariants.forEach((variant:any)=>{
      variantName.push({
        variant: variant.item.variant_name?? variant.item.name,
        variantIndex : variant.item.variantIndex,
        variation:  variant.variation
      })
    })


    this.selectedVariants.forEach(name=>{
      if(name.variation != 'type'){
        variantImage = name.item.image[0];
        // return name.item.image
      }
    })
    // console.log('IMAGE',image)
    const cartData = await firstValueFrom(combineLatest([
      this.productDetails$,
      this.productService.shopData$,
    ]))

    const prodDetails  = cartData[0]
    const shopData     = cartData[1]
    
    let pushCart:any
    if(prodDetails.variants){
      pushCart = {
        clientId  : JSON.parse(localStorage.getItem('userData')!).id,
        shopId    : shopData.id,
        productId : prodDetails.id,
        name      : prodDetails.name,
        price     : this.price,
        stocks    : this.stocks,
        quantity  : this.quantity,
        variants  : variantName,
        image     : variantImage,
      }
    } else {
      pushCart = {
        clientId  : JSON.parse(localStorage.getItem('userData')!).id,
        shopId    : shopData.id,
        productId : prodDetails.id,
        name      : prodDetails.name,
        price     : prodDetails.price,
        stocks    : prodDetails.in_stock,
        quantity  : this.quantity,
        image     :  prodDetails.images[0],
      }

      console.log('variantImage', pushCart)  
    }
    
    try {
      this.dataQueries.addToBulk(pushCart);
      this.selectedVariants.length = 0
      this.quantity = 1
      this.router.navigate(['/bulks'])
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  }

  getAverageRating(productDetails:any){
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

function pickUniqueNumbers(arrayLength: number){
  const k = arrayLength < 5 ? arrayLength : 5
  const shuffledNumbers = Array.from({ length: arrayLength + 1 }, (_, index) => index).slice(1).sort(() => Math.random() - 0.5);
  return shuffledNumbers.slice(0, k);
}

function getRandomNumber(n:number) {
  return Math.floor(Math.random() * (n + 1));
}







