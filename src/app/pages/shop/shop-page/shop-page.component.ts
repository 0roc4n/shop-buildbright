import { AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, ReplaySubject, map, tap } from 'rxjs';
import { DataqueriesService } from 'src/app/services/dataqueries.service';
import { ProductService } from 'src/app/services/product.service';
import { IonSlides, ModalController } from '@ionic/angular';
import { SearchComponent } from 'src/app/components/modals/search/search.component';
import { DomSanitizer } from '@angular/platform-browser';
import { Database, onValue, ref } from '@angular/fire/database';

@Component({
  selector: 'app-shop-page',
  templateUrl: './shop-page.component.html',
  styleUrls: ['./shop-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ShopPageComponent  implements OnInit,AfterViewInit,OnChanges {
  @ViewChild('pageswiper')pageswiper!: ElementRef
  @ViewChild('slider', { static: true }) slider!: IonSlides;

  @Input() productTtems!:any[]
  @Input() allProducts!:any[]
  @Input() shopData!:any
  @Input() categories!:any[]
  @Input() shopName!:any

  photoUrls: string[] = [];
  bestSeller$ = this.productService.bestSeller$

  seeRest = false;

  videoUrl:any = 'https://www.youtube.com/embed/H4tNZxl-p3o'

  icons = [
    { 
      name : 'Buildrite',
      icon : '/assets/caticon/bucket.png'
    },
    { 
      name : 'Health & Safety',
      icon : '/assets/caticon/worker.png'
    },
    { 
      name : 'Nail,Tox & Screw',
      icon : '/assets/caticon/nail.png'
    },
    { 
      name : 'Sealant & Adhesive',
      icon : '/assets/caticon/sealant-gun.png'
    },
    { 
      name : 'Shera Board',
      icon : '/assets/caticon/wood.png'
    },
    { 
      name : 'Sunrise Brand',
      icon : '/assets/caticon/sunrise.png'
    },
    { 
      name : 'Amazon',
      icon : '/assets/caticon/boxes.png'
    },
    { 
      name : 'Finishing Materials',
      icon : '/assets/caticon/membrane.png'
    },
    { 
      name : 'Green Trees Catalogue',
      icon : '/assets/caticon/christmas-tree.png'
    },
    { 
      name : 'Heavy Equipment Trucks',
      icon : '/assets/caticon/box-truck.png'
    },
    { 
      name : 'Shelby Brand',
      icon : '/assets/caticon/house.png'
    },
    { 
      name : 'Tiling Supplies',
      icon : '/assets/caticon/tiles.png'
    },
    { 
      name : 'Electrical Fixtures & Devices',
      icon : '/assets/caticon/torch.png'
    },


    // old
    { 
      name : 'Wires And Cable',
      icon : '/assets/caticon/rope.png'
    },
    {
      name : 'Chemical',
      icon : '/assets/caticon/water.png'
    },
    {
      name : 'Concreting & Masonry',
      icon : '/assets/caticon/cement.png'
    },
    {
      name : 'Glass Doors & Windows',
      icon : '/assets/caticon/door-knob.png'
    },
    {
      name : 'Door and Jambs',
      icon : '/assets/caticon/door.png'
    },
    
    {
      name : 'Steel',
      icon : '/assets/caticon/beam.png'
    },
    {
      name : 'Electrical Pipes & Accessories',
      icon : '/assets/caticon/tool.png'
    },
    {
      name : 'Wood Product',
      icon : '/assets/caticon/wood-plank.png'
    },
    {
      name : 'Others',
      icon : '/assets/caticon/more-information.png'
    },
    {
      name : 'Painting Supplies',
      icon : '/assets/caticon/paint-bucket.png'
    },
    {
      name : 'Phildex',
      icon : '/assets/caticon/pipe.png'
    },
    {
      name : 'Rebars & Gi Wires',
      icon : '/assets/caticon/iron-bar.png'
    },
    {
      name : 'Roofing & Insulation',
      icon : '/assets/caticon/insulating.png'
    },
    {
      name : 'Screen And Coverings',
      icon : '/assets/caticon/wire.png'
    },
    {
      name : 'Water Proofing',
      icon : '/assets/caticon/waterproof.png'
    },
  ]

  constructor(public productService   : ProductService,
              private dataQueries     : DataqueriesService,
              private router          : Router,
              private modalController : ModalController,
              private sanitizer       : DomSanitizer,
              private cdr : ChangeDetectorRef,
              private db              : Database) { }


  ngOnChanges(changes: SimpleChanges): void {
  }


  ngOnInit() {
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
  //  console.log("productTtems",this.productTtems);
  }

  getAds() {
    const adsRef = ref(this.db, '/adsphotos');
    const ads: any[] = [];
    
    onValue(adsRef, (snapshot) => {
      const data = snapshot.val();
      
      for (let key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const url = data[key].url;
          ads.push(url);
        }
      }
    });
    return ads;
  }
  

  getProduct(productId:string){
    return this.productTtems.find((prod:any)=>prod.id === productId)
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

  async filterSearch(){
    const modal = await this.modalController.create({
      component: SearchComponent
    })

    modal.present()
  }

  showVideo(video:any){
    const autoplayUrl = video + '?autoplay=0  ';
    return this.sanitizer.bypassSecurityTrustResourceUrl(autoplayUrl);
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

    try{
      if (firstKey) {
        return productItem.variants[firstKey][0].image[0].imageRef;
      } else{
          return productItem.images[0].imageRef;
      }
    }catch(e){
      console.log(productItem.id)
      return null;
    }
  }

  getMinMaxPrice(data: any, discounted:boolean = true) {
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

  options = {
    pagination: {
      el: '.swiper-pagination',
      dynamicBullets: true,
    },
    speed:300,
    autoplay:true,
    loop:true,
  }
  showCat(c:any) {
    localStorage.setItem('shopId', JSON.stringify(this.shopData));
    const cate: any[] = [];
    const gory:any[] = []
    const category:any[] = []
  
    for (let i = 0; i < c.length; i++) {
      if (i < c.length/2) {
        cate.push(c[i]);
      }
      else{
        gory.push(c[i])
      }
    }
    const split = {
      out: cate,
      hide: gory,
    }

    category.push(split)

    return category
  }

  getIconByName(category: any): any {
    if(category.icon){
      return category.icon.imageRef
    }
    return this.icons.find(icon => icon.name === category.name)?.icon;
  }

  getProductsByCategoryId(categoryId: string){
    const products =this.allProducts.filter(product => {
      return product.category == categoryId;
    }).sort((a:any, b:any) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return -1
      if (nameA > nameB) return  1
      return 0
    }) ;
    return products;
  }

  routeBulks() {
    this.router.navigateByUrl('/bulks');
  }

  goToCart(){
    this.router.navigateByUrl('/view-cart')
  }

  getAverageRating(productDetails:any){
    if(productDetails.variants){
      if(productDetails.variants.colors){
        var totalRating = 0;
        var ratings = 0;
        try{
          for(let i =0; i < productDetails.variants.colors.length; i++){
            for(let j = 0; j < productDetails.variants.colors[i].types.length; j++){
              if(productDetails.variants.colors[i].types[j].totalRating!=null){
                totalRating += productDetails.variants.colors[i].types[j].totalRating;
                ratings +=1;
              }
            }
          }
        }catch(e){
          console.log(productDetails.id);
        }
        return ratings ? (totalRating/ ratings).toFixed(1) : 0
      }else{
        var totalRating = 0;
        var ratings = 0;
        try{
          for(let i =0; i < productDetails.variants.size.length; i++){
            if(productDetails.variants.size[i].totalRating!= null){
              totalRating += productDetails.variants.size[i].totalRating;
              ratings +=1;
            }
          }
        }catch(e){
          // console.log(productDetails.variants)
          console.log(productDetails.id)
        }
        return ratings ? (totalRating/ratings).toFixed(1) : 0
      }
    }else{
      return productDetails.totalRating != null ? productDetails.totalRating.toFixed(1) :0;
    }
  }
}

