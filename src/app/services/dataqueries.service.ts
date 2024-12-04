import { Injectable } from '@angular/core';
import { DataSnapshot, Database, Query, QueryConstraint, child, equalTo, limitToFirst, list, listVal, object, objectVal, off, orderByChild, orderByValue, push, query, ref, remove, set, update, } from '@angular/fire/database';
import { BehaviorSubject, Observable, combineLatest, firstValueFrom, map, of, switchMap, take, tap } from 'rxjs';
import { QuatationStatus, Status } from '../interfaces/status';
import { HelperService } from './helper.service';
@Injectable({
  providedIn: 'root'
})
export class DataqueriesService {

  private selectedProductsSource = new BehaviorSubject<any[]>([]);
  selectedProducts$ = this.selectedProductsSource.asObservable();

  private selectedProduct = new BehaviorSubject<any[]>([]);
  selectedProd$ = this.selectedProduct.asObservable();

  constructor(private afDB : Database,
              private helper: HelperService) { }


  get userRef(){
    return ref(this.afDB,'/users')
  }

  get getDeliveryFees(){
    return
  }

  getVariantIndex(variant_name:string, variants:any):number{

      for(let i = 0; i <  variants.length; i++){
        if(variants[i].variant_name == variant_name){
          return i;
        }
      }
    
    return -1;
  }

  async getUserData(email:string){
    return await firstValueFrom(listVal(query(this.userRef,orderByChild('/email'),equalTo(email)),{keyField:'id'}));
  }

  getUserById(userId:string){
    return objectVal(ref(this.afDB,`/users/${userId}`),{keyField:'id'})
  }

  getUsersByEmail(email:string){
    return listVal(query(ref(this.afDB,`/users`), orderByChild('email'), equalTo(email)))
  }

  updatePushNotifKey(token:string){
    const userId = JSON.parse(localStorage.getItem('userData')!).id
    set(ref(this.afDB,`/users/${userId}/pushNotifKey`),token)
  }

  getProducts(){
    return objectVal(ref(this.afDB,'/storeFocusId')).pipe(
      take(1),
      switchMap((shopId)=>{
        const prodRef = query(ref(this.afDB, `/products/${shopId}`))
        const catRef  = ref(this.afDB, `/categories/${shopId}`)
        const shopRef = ref(this.afDB, `/users/${shopId}`)
        return combineLatest([
          objectVal(shopRef,{keyField:'id'}),
          listVal(prodRef,{keyField:'id'}),
          listVal(catRef, {keyField:'id'})
        ])
      })
    )
  }

  // getStoreOfProduct(productId:string){
    
  //   return 

  // }

  getProductByCategory(categoryId:string,shopId:string){
    const catProdQuery = query(ref(this.afDB, `/products/${shopId}`), orderByChild('category'), equalTo(categoryId))
    return listVal(catProdQuery,{keyField:'id'})
  }

  getFocusAllOrders(){
    return objectVal(ref(this.afDB,'/storeFocusId')).pipe(
      take(1),
      switchMap((storeId:any)=>
        listVal(query(ref(this.afDB,'/orders'),orderByChild('storeId'), equalTo(storeId))).pipe(
          map((orders:any)=>orders.filter((order:any)=>order.status >= 1))
        )
      )
    )
  }

  getProductById(productId:string, storeId:string){
    return objectVal(ref(this.afDB,`/products/${storeId}/${productId}`)) as Observable<any>
  }

  // getCurrentOrder():Observable<string | null>{
  //   const userId = JSON.parse(localStorage.getItem('userData')!).id
  //   return objectVal(ref(this.afDB,`/users/${userId}/orderId`)).pipe(
  //     switchMap((orderId)=>{
  //       if(orderId){
  //         return this.getOrder(orderId as string).pipe(
  //           switchMap((order:any)=>{
  //             const orderArr = [
  //               this.getUserById(order.clientId),
  //               this.getUserById(order.storeId),
  //               combineLatest((order.items as any[]).map((item:any)=>this.getProductById(item.productId,order.storeId)))
  //             ]
  //             if(order.voucherId){
  //               orderArr.push(
  //                 this.getVoucher(order.storeId,order.voucherId)
  //               )
  //             }
  //             return combineLatest(orderArr).pipe(
  //               map((userInfo:any)=>{
  //                 (userInfo[0] as any).address = this.helper.objToArrWithId( (userInfo[0] as any).address)
  //                 order.items.forEach((item:any, index:number) => {
  //                   order.items[index].productDetails =  userInfo[2][index]
  //                 });

  //                 if(userInfo[3]){
  //                   return{
  //                     ...order,
  //                     clientInfo  : userInfo[0],
  //                     storeInfo   : userInfo[1],
  //                     voucherInfo : userInfo[3]
  //                   }
  //                 }
  //                 else return{
  //                   ...order,
  //                   clientInfo : userInfo[0],
  //                   storeInfo  : userInfo[1],
  //                 }
  //               })
  //             )
  //           })
  //         )
  //       }
  //       else return of(null)
  //     }),
  //   )
  // }

  updateOrderItems(orderId:string,items:any ){
    set(ref(this.afDB,`/orders/${orderId}/items`),items)
  }

  deleteOrder(orderId:string){
    remove(ref(this.afDB,`/orders/${orderId}`))
  }

  getOrder(orderId:string){
    return objectVal(ref(this.afDB,`/orders/${orderId}`),{keyField:'id'})
    // return this.orderList.query.orderByKey().equalTo(orderId)
  }

  getRiderLocation(riderId: string){
    return objectVal(ref(this.afDB,`/rtLocation/${riderId}`))
    // return this.afDB.list('rtLocation').query.orderByKey().equalTo(riderId)
  }

  addToCart(product:any) {
    if (product.clientId) {
      const cartRef = ref(this.afDB, `/cart/${product.clientId}`);
      push(cartRef, product);
    } else {
      console.error("Product clientId is undefined or invalid.");
    }
  }

  addToBulk(product:any) {
    if (product.clientId) {
      const cartRef = ref(this.afDB, `/bulk/${product.clientId}`);
      push(cartRef, product);
    } else {
      console.error("Product clientId is undefined or invalid.");
    }
  }
  
  

  addOrder(product:any){
    const key = push(ref(this.afDB,`/orders`),product).key
    set(ref(this.afDB,`/users/${product.clientId}/orderId`),key)
  }

  updateOrder(editOrder:any){
    const orderId = editOrder.id
    delete editOrder.id
    set(ref(this.afDB,`/orders/${orderId}`),editOrder)
  }

  async placeOrder(orderId:string, deliveryAddress:any, paymentMethod:string, clientDeliveryDate: number, deliveryFeeDetails?:any, payPalData?:any, specialInstructions?:string){

    const toUpdate: any = {
      status: 1,
      paymentMethod       : paymentMethod,
      clientDeliveryDate  : clientDeliveryDate,
      specialInstructions : specialInstructions
    }

    if(deliveryFeeDetails) toUpdate.deliveryFeeDetails = deliveryFeeDetails
    if(deliveryAddress) toUpdate.deliveryAddress       = deliveryAddress

    if(payPalData) toUpdate.payPalData =  {
      id: payPalData.id,
      payer:{...payPalData.payer}
    }

    console.log("toUpdate",toUpdate);


    await update(ref(this.afDB,`/orders/${orderId}`),toUpdate)
  }

  cancelOrder(orderId:string){
    update(ref(this.afDB,`/orders/${orderId}`),{
      status: Status.Canceled
    })
    // const userId = JSON.parse(localStorage.getItem('userData')!).id
    // remove(ref(this.afDB,`/users/${userId}/orderId`))
  }

  createUserKey(){
    return push(ref(this.afDB,'/users')).key
  }

  async updateUser(userKey:string, userData:any){
    delete userData.password
    await set(ref(this.afDB,`/users/${userKey}`),userData)
  }

  async addAddress(addressLength : number,addressToPush:any){
    const userData = JSON.parse(localStorage.getItem('userData')!);

    await set(ref(this.afDB, `/users/${userData.id}/address/${addressLength}`), addressToPush)
      .then(() => {
        this.getUserById(userData.id).subscribe(see => {
          console.log("userData", see);
          localStorage.setItem('userData', JSON.stringify(see))
        });
      })
      .catch(error => {
        console.error("Error setting data:", error);
      });
  }
  updateLocalUser(user:any){
    localStorage.setItem('userData', JSON.stringify(user))
  }

  getOrderHistory(){
    const userId = JSON.parse(localStorage.getItem('userData')!).id
    return listVal(query(ref(this.afDB,'/orders'), orderByChild('clientId'), equalTo(userId)),{
      keyField: 'id'
    }) as Observable<any[]>
  }

  async addReview(productId:string, storeId:string, reviewData:any){
    const userId = JSON.parse(localStorage.getItem('userData')!).id

  }

  forQuotation(orderId:string, message?:any){
    update(ref(this.afDB,`/orders/${orderId}`),{
      quotation:{
        status: 'pending',
        messages: message ? [message] : null
      }
    })
  }

  sendOfferedQuotation(orderId:string, chatArray:any[]){
    set(ref(this.afDB,`/orders/${orderId}/quotation/messages`),chatArray)
  }

  async declineOffer(orderId:string, chatArray?: any[]){
    await update(ref(this.afDB,`/orders/${orderId}/quotation`),{
      // quotation:{
      //   status   : 'declined',
      //   messages : chatArray
      // }
      status: Status.Declined
    })

  }

  getUserReviews(){
    const userId = JSON.parse(localStorage.getItem('userData')!).id
    return objectVal(ref(this.afDB,'/storeFocusId')).pipe(
      take(1),
      switchMap((storeId:any)=>listVal(query(ref(this.afDB,`/reviews/${storeId}`),orderByChild('clientId'),equalTo(userId))))
    )
  }

  async submitReview(reviewData:any, productDetails:any){
    const userId = JSON.parse(localStorage.getItem('userData')!).id
    await firstValueFrom(objectVal(ref(this.afDB,'/storeFocusId')).pipe(
      take(1),
      tap((storeId:any)=>{
        push(ref(this.afDB,`/reviews/${storeId}/`),{
          ...reviewData,
          timestamp : new Date().getTime(),
          clientId  : userId
        })
      }),
      switchMap((storeId)=>
        listVal(query(ref(this.afDB,`/reviews/${storeId}`),orderByChild('productId'),equalTo(reviewData.productId)),{
          keyField: 'id'
        }).pipe(
          switchMap((reviews:any)=>{

            if(reviewData.variantIndex === null || reviewData.variantIndex === undefined){
              return update(ref(this.afDB,`/products/${storeId}/${reviewData.productId}`),{
                totalRating : reviews.reduce((rating:number, review:any)=> review.rating + rating, 0) / reviews.length
              })
            }
            else{
             if(productDetails.variants.color){
              const variantRating = reviews.filter((review:any)=> review.variantIndex === reviewData.variantIndex)
              return update(ref(this.afDB,`/products/${storeId}/${reviewData.productId}/variants/color/${reviewData.variantIndex}`),{
                totalRating :variantRating.reduce((rating:number, review:any)=> review.rating + rating, 0) / variantRating.length
              })
             }else if(productDetails.variants.colors){
              const variantRating = reviews.filter((review:any)=> review.variantIndex === reviewData.variantIndex)
              return update(ref(this.afDB,`/products/${storeId}/${reviewData.productId}/variants/colors/${reviewData.variantIndex}/types/${reviewData.type}`),{
                totalRating :variantRating.reduce((rating:number, review:any)=> review.rating + rating, 0) / variantRating.length
              })
             }
             else if(productDetails.variants.size){
              const variantRating = reviews.filter((review:any)=> review.variantIndex === reviewData.variantIndex)
              return update(ref(this.afDB,`/products/${storeId}/${reviewData.productId}/variants/size/${reviewData.variantIndex}`),{
                totalRating :variantRating.reduce((rating:number, review:any)=> review.rating + rating, 0) / variantRating.length
              })
             }else{
              const variantRating = reviews.filter((review:any)=> review.variantIndex === reviewData.variantIndex)
              return update(ref(this.afDB,`/products/${storeId}/${reviewData.productId}/variants/${reviewData.variantIndex}`),{
                totalRating :variantRating.reduce((rating:number, review:any)=> review.rating + rating, 0) / variantRating.length
              })
             }
   
            }
          })
        )
      )
    ))
  }

  getProductReviews(productId:any){
    return objectVal(ref(this.afDB,'/storeFocusId')).pipe(
      take(1),
      switchMap((storeId:any)=>listVal(query(ref(this.afDB,`/reviews/${storeId}`),orderByChild('productId'),equalTo(productId))))
    )
  }

  sendChat(orderId:string, chat:any[]){
    set(ref(this.afDB,`/orders/${orderId}/chat`),chat)
  }

  async requestReturn(orderId:string, storeId:string, returnProdArray:any[], message: string){
    await Promise.all([
      update(ref(this.afDB,`/orders/${orderId}`),{
        returnProductStatus: Status.Pending
      }),
      set(ref(this.afDB,`/returnProducts/${storeId}/${orderId}`),{
        id: orderId,
        status  : Status.Pending,
        products: returnProdArray,
        timestamp: new Date().getTime(),
        chat    :[
          {
            message   : message,
            from      :'client',
            timestamp : new Date().getTime(),
            read      : false
          }
        ]
      })
    ])
  }

  getReturnProd(orderId:string, storeId:string){
    return objectVal(ref(this.afDB, `/returnProducts/${storeId}/${orderId}`),{
      // keyField: 'id'
    })
  }

  chatReturnProduct(orderId:string, storeId: string, messageArray:any[]){
    set(ref(this.afDB, `/returnProducts/${storeId}/${orderId}/chat`),messageArray)
  }

  getAvailableVouchers(){
    const userId = JSON.parse(localStorage.getItem('userData')!).id
    const currentDate = new Date().getTime()

    // query(ref(this.afDB,`/claimedVouchers/${storeId}/`),orderByValue(), equalTo(userId))


    return objectVal(ref(this.afDB,'/storeFocusId')).pipe(
      take(1),
      switchMap((storeId)=>
        listVal(ref(this.afDB,`/claimedVouchers/${storeId}/${userId}`)).pipe(
          switchMap((claimedVouchers)=>{
            if(claimedVouchers?.length){
              return listVal(ref(this.afDB,`/vouchers/${storeId}`),{
                keyField: 'id'
              }).pipe(
                map((vouchers:any)=>vouchers.filter((voucher:any)=> new Date(voucher.voucherExpiry).getTime() >= currentDate && claimedVouchers.findIndex((claimed:any)=>claimed.voucherId === voucher.id) === -1 ))
              )
            }
            else return listVal(ref(this.afDB,`/vouchers/${storeId}`),{
              keyField: 'id'
            }).pipe(
              map((vouchers:any)=>vouchers.filter((voucher:any)=> new Date(voucher.voucherExpiry).getTime() >= currentDate ))
            )
          })
        )
      )
    )
  }

  reopenReturn(orderId:string, storeId:string){
    update(ref(this.afDB,`/returnProducts/${storeId}/${orderId}`),{
      status: Status.Pending
    })
    update(ref(this.afDB,`orders/${orderId}`),{
      returnProductStatus: Status.Pending
    })
    update(ref(this.afDB,`orders/${orderId}`),{
      status: Status.Delivered
    })
  }

  applyVoucher(orderId:string, storeId:string, voucherId:string){
    const userId = JSON.parse(localStorage.getItem('userData')!).id
    update(ref(this.afDB,`/orders/${orderId}`),{
      voucherId: voucherId
    })
    push(ref(this.afDB,`/claimedVouchers/${storeId}/${userId}`),{
      voucherId
    })
  }

  getVoucher(storeId:string,voucherId:string){
    return objectVal(ref(this.afDB,`vouchers/${storeId}/${voucherId}`))
  }

  getPricePerDistance(){
    return objectVal(ref(this.afDB,'/storeFocusId')).pipe(
      take(1),
      switchMap((storeId)=>
        listVal(ref(this.afDB,`/pricePerDistance/${storeId}`)).pipe(
          map((ppr)=> ppr?.sort((a:any,b:any)=>a.distance - b.distance))
        )
      )
    )

  }

  async cancelQuotation(order:any){
    const items:any = order.items.map(
      (item:any)=>{
        if(item.variants){
          return {
            productId : item.productId,
            variants  : item.variants.map((variant:any)=>{
              return {
                price        : variant.price,
                variantIndex : variant.variantIndex,
                quantity     : variant.quantity
              }
            })
          }
        }
        else{
          return {
            price: item.price,
            productId: item.productId,
            quantity: item.quantity
          }
        }
      }
    )
    console.log("items",items);
    await update(ref(this.afDB,`/orders`),{
      items: items
    })

    await remove(ref(this.afDB,`/orders/${order.id}/quotation`))

  }

  getCheckOutProducts(products: any[]){
    this.selectedProductsSource.next(products);
  }

  goCheckOutProducts(products: any[]){
    this.selectedProduct.next(products);
  }

  goToPayment(price:any){
    return price
  }

  successPayment(id:any){
    return id
  }


}
