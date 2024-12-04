import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss'],
})
export class ConfirmationComponent  implements OnInit {
  transactID = ""
  constructor( private route:ActivatedRoute) { }

  ngOnInit() {
    this.transactID = this.route.snapshot.paramMap.get('transactionID')!;
  }

}
