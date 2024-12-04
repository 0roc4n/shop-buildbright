import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-purchase-done',
  templateUrl: './purchase-done.component.html',
  styleUrls: ['./purchase-done.component.scss'],
  standalone: true,
  imports:[CommonModule, IonicModule]
})
export class PurchaseDoneComponent  implements OnInit {

  constructor(private router: Router, private loadingController: LoadingController, private modalController : ModalController) { }

  ngOnInit() {}

  async goToShop() {
    const loading = await this.loadingController.create({
      message: 'Going Back to Shop',
    });
  
    await loading.present();

    await this.modalController.dismiss();
    console.log('routing to shop');
    this.router.navigate(['/shop']);
  
    await loading.dismiss();
  }

  async goToOrders() {
    const loading = await this.loadingController.create({
      message: 'Loading...', // You can customize the loading message
      spinner: 'crescent', // You can choose a different spinner style
      translucent: true,
      showBackdrop: true
    });
  
    await loading.present();
  
    try {
      this.router.navigate(['/view-order']);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      await this.modalController.dismiss();
      await loading.dismiss();
    }
  }
  

}
