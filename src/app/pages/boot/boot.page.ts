import { Component, } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-boot',
  templateUrl: './boot.page.html',
  styleUrls: ['./boot.page.scss'],
})
export class BootPage  {

  constructor(private router:Router){}
  ionViewDidEnter() {
    sessionStorage.setItem('booted','true')
    setTimeout(() => {
      this.router.navigate(['']);
    }, 2000);
  }

}
