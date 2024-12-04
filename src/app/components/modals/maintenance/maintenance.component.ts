import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
  standalone:true,
  imports:[IonicModule, CommonModule]
})
export class MaintenanceComponent  implements OnInit {

  constructor(private load:LoadingController, private modal:ModalController, private router:Router) { }

  ngOnInit() {}

  async goToOrders() {
    const loading = await this.load.create({
      message: 'Loading...',
      spinner: 'bubbles', 
      translucent: true,
      showBackdrop: true
    });
  
    await loading.present();
  
    try {
      this.router.navigate(['/']);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      // await this.modal.dismiss();
      await loading.dismiss();
    }
  }

}
