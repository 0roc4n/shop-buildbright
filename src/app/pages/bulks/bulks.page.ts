import { AfterViewChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SearchComponent } from 'src/app/components/modals/search/search.component';
import { AlertController, ModalController } from '@ionic/angular';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Database, off, onValue, ref, remove } from '@angular/fire/database';
import { child, push, query, update } from 'firebase/database';
import { Status } from 'src/app/interfaces/status';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-bulks',
  templateUrl: './bulks.page.html',
  styleUrls: ['./bulks.page.scss'],
})
export class BulksPage implements OnInit {
  clientId = JSON.parse(localStorage.getItem('userData')!).id;
  bulkRef = ref(this.db, `/bulk/${this.clientId}`);

  shopDatas = JSON.parse(localStorage.getItem('shopId')!)
  
  constructor(  private modalController: ModalController,
                private fb : FormBuilder,
                private db : Database,
                private cdRef :ChangeDetectorRef,
                private dataQueries:DataqueriesService,
                private alertController:AlertController,
                private router:Router
                ) { }

  bulkOrder:FormGroup = this.fb.group({
    customerName: this.fb.nonNullable.control('', [Validators.required]),
    customerEmail : this.fb.nonNullable.control('', [Validators.required])
  })

  quantityForm:FormArray = this.fb.array([]);
  currentBulk:any

  ngOnInit() {
    const orderRef = query(ref(this.db, `/orders`));    
    onValue(orderRef, async (snapshot) => {
      const orders = Object.values(snapshot.val());
      this.currentBulk =  orders.find((order:any)=>order.quotation?.status === Status.Pending||order.quotation?.status === Status.Offered)
      
      if(this.currentBulk == undefined){
        this.items = [];
        this.quantityForm = this.fb.array([]);
        onValue(this.bulkRef, async (snapshot) => {
          const bulks = snapshot.val();
          if (bulks) {
            for (const key in bulks) {
              if (bulks.hasOwnProperty(key)) {
                const cartValue = bulks[key]
                const existingProductIndex = this.items.findIndex(product => product.cartId === key);
    
                if(existingProductIndex !== -1){
                  this.items[existingProductIndex].quantity = cartValue.quantity;
                } else {
                  const product = await firstValueFrom(this.dataQueries.getProductById(cartValue.productId, this.shopDatas.id))
                  if(product == null){
                    continue;
                  }
                  if(cartValue.variants){
                    const data = {
                      cartId : key,
                      productId : cartValue.productId,
                      shopId : cartValue.shopId,
                      name : cartValue.name,
                      quantity : cartValue.quantity,
                      stocks : cartValue.stocks,
                      discount: product.discount,
                      price : this.getDiscountedPrice(cartValue.price, product.discount),
                      images : cartValue.image.imageRef,
                      variants : cartValue.variants,
                      selected : false
                    }
                    this.quantityForm.push(
                      this.fb.nonNullable.control(cartValue.quantity, [Validators.required, Validators.min(1), Validators.max(cartValue.stocks)])
                    )
                    this.items.push(data)
                  } else {
                    const data = {
                      cartId : key,
                      productId : cartValue.productId,
                      shopId : cartValue.shopId,
                      name : cartValue.name,
                      quantity : cartValue.quantity,
                      discount: product.discount,
                      stocks : cartValue.stocks,
                      price : this.getDiscountedPrice(cartValue.price, product.discount),
                      images : cartValue.image.imageRef,
                      selected : false
                    }
                    this.quantityForm.push(
                    this.fb.nonNullable.control(cartValue.quantity, [Validators.required, Validators.min(1)])
                    )
                    this.items.push(data)
                
                  }
                }
              }
            }
          }
        });
    
     }else{
      this.currentBulk.orderId = Object.entries(snapshot.val()).find((order:any)=>order[1].quotation?.status === Status.Pending || order[1].quotation?.status === Status.Offered)![0];
      for(let item of this.currentBulk.products){
        const product = await firstValueFrom(this.dataQueries.getProductById(item.productId, this.shopDatas.id))
        item.price = this.getDiscountedPrice(item.price,product.discount);
        item.discount = product.discount;
      }
      this.items = this.currentBulk.products;
     }
  });
    
    this.cdRef.detectChanges();
  }
  
  // ngAfterViewChecked(): void {
  //   if(this.currentBulk){
  //     this.chatScrollEnd();
  //   }
  // }

  checkout() {
    this.dataQueries.getCheckOutProducts(this.items);
    this.router.navigate(['/check-out', {bulk:this.currentBulk.orderId}]);
  }

  getDiscountedPrice(price:any, discount:number){
    if(discount && discount > 0)
      return Number((Number(price) - (Number(price) * (discount/100))).toFixed(2));
    else return price;
  }
  

  items: any[] = [];

  addItem() {
    this.filterSearch();
  }
  chatInput = this.fb.control('')
  chatBOP(order: any){
    if(this.chatInput.value) {
     if(order.quotation.messages){
      order.quotation.messages.push({
        from      : 'client',
        message   : this.chatInput.value,
        read      : false,
        timestamp : new Date().getTime()
      })
      this.dataQueries.sendOfferedQuotation(order.orderId,  order.quotation.messages)
      this.chatInput.reset()
     }else{
      order.quotation.messages=[];
      order.quotation.messages.push({
        from      : 'client',
        message   : this.chatInput.value,
        read      : false,
        timestamp : new Date().getTime()
      })
      this.dataQueries.sendOfferedQuotation(order.orderId, order.quotation.messages)
      this.chatInput.reset()
     }
    }
  }

  updateQuantity(event:any, product:any){
    if(Number(event.target.value)>0){
      product.quantity = Number(event.target.value);
      this.updateQuantityInDatabase(product);
    }
  }

  notEnoughStocks(product:any){
    return product.quantity > product.stocks;
  }

  getRetailTotal(){
    const price = this.currentBulk.products.reduce((prev:number,curr:any)=>{
      return ((curr.price * curr.quantity)) + prev
    },0)
    return price;
  }
  getOfferTotal(){
    const price = this.currentBulk.products.reduce((prev:number,curr:any)=>{
      return (curr.bulk_price) + prev
    },0)

    return price;
  }
  getForm(index:number){
    return this.quantityForm.get(index.toString()) as FormControl;
  }

  quantityInvalid(index:number){
    if(this.getForm(index) == null){
      return false;
    }
    return this.getForm(index).invalid;
  }

  checkFormIsValid(){
    return !this.quantityForm.invalid;
  }

  updateQuantityInDatabase(product: any): void {
    const productPath = `${product.cartId}/quantity`;
    const updates :any = {};
    updates[productPath] = product.quantity;
  
    update(this.bulkRef, updates)
      .catch((error) => {
        console.error('Error updating quantity:', error);
      });
  }
  
  checkResponded(){
    return this.currentBulk.quotation?.status == Status.Offered;
    // const hasItem = this.items.find(item=>
    //   item.bulk_price == null
    // )
    // return hasItem == null;
  }



  async deleteItem(product: any) {
    const index = this.items.indexOf(product);
    if (index > -1) {
      this.items.splice(index, 1);
    }

    const productRef = child(this.bulkRef, product.cartId);

    try {
      // Wait for the removal operation to complete
      await remove(productRef);
      console.log('Item removed from the database');
    } catch (error) {
      console.error('Error removing item from the database', error);
    }
  }
  
  submitForm() {
    var products = [];

    for (let item of this.items){
      console.log(item);
      products.push({
        image: item.images,
        name: item.name,
        price: item.price,
        productId: item.productId,
        quantity: item.quantity,
        variants : item.variants
      });
    }

    const bulkOrderObject = {
      clientId: this.clientId,
      storeId: this.shopDatas.id,
      products: products,
      // status: Status.InCart,
      quotation:{
        status: Status.Pending,
      }
    }
    // console.log(bulkOrderObject);
    remove(this.bulkRef);
    const sendOrderRef = ref(this.db, '/orders');
    push(sendOrderRef, bulkOrderObject);
  }

  async filterSearch(){
    const modal = await this.modalController.create({
      component: SearchComponent,
      componentProps:{
        addBulk: true
      },
    })


    modal.present()
  }

chatScrollEnd(){
  document.querySelector('#chatScroll')!.scrollTop = document.querySelector('#chatScroll')!.scrollHeight;
}

getOfferDeduction(){
  const retailTotal = this.getRetailTotal();
  const offerTotal = this.getOfferTotal();
  return (((offerTotal-retailTotal)/ retailTotal)*100).toFixed(0) + '%';
}



decline(){
  this.dataQueries.declineOffer(this.currentBulk.orderId)
}

async showDeclineAlert() {
  const alert = await this.alertController.create({
    header: 'Are you sure you want to decline?',
    // subHeader: 'Subtitle',
    message: 'Your bulk form will be removed from this page.',
    buttons: [
      {
        text:'Cancel',
      },{
        text:'Decline',
        handler: ()=>{
          this.decline();
        }
      }
    ],
    
  });


  await alert.present();
}


}
