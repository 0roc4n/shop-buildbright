import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-review-icons',
  templateUrl: './review-icons.component.html',
  styleUrls: ['./review-icons.component.scss'],
  standalone: true,
  imports:[CommonModule,IonicModule]
})
export class ReviewIconsComponent  implements OnChanges{
  @Input() rating! : number;
  @Input() outOf!  : number;
  iconArray!:string[] 
  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    this.iconArray = []

    const remainder = this.rating % 1
    const rating    = this.rating - remainder
    const outOf     = this.outOf - rating

    for(let r = rating; r >0 ; r--)  this.iconArray.push('star')
    if (remainder)                   this.iconArray.push('star-half')
    for(let o = outOf; o >0 ; --o)   this.iconArray.push('star-outline')
  }

}
