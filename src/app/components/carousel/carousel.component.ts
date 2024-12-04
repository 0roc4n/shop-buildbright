import { CommonModule } from '@angular/common';
import { AfterContentChecked, AfterContentInit, AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
// import { SwiperComponent, SwiperModule } from 'swiper/angular';
// import SwiperCore, { Autoplay, Keyboard, Mousewheel,  Pagination,  Scrollbar,  SwiperOptions, Zoom } from 'swiper';
import { IonicModule, ModalController } from '@ionic/angular';

// SwiperCore.use([Autoplay, Keyboard, Pagination, Scrollbar, Zoom]);

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports:[IonicModule, CommonModule]
})
export class CarouselComponent  implements OnInit {



  constructor(private modalController: ModalController) {}


  ngOnInit() {
  }

  ngAfterViewChecked(){
  }



}
