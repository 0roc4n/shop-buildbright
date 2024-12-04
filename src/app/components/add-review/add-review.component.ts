import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, LoadingController, ModalController } from '@ionic/angular';
import { DataqueriesService } from 'src/app/services/dataqueries.service';

@Component({
  selector: 'app-add-review',
  templateUrl: './add-review.component.html',
  styleUrls: ['./add-review.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class AddReviewComponent  implements OnInit {

  ratingAct = 0
  reviewed = false;
  completeProdDetails!:any

  review = this.fb.control('', Validators.required)


  constructor(private modalController    : ModalController,
              private fb                 : FormBuilder,
              private dataQueries        : DataqueriesService,
              private loadingController  : LoadingController) { }

  ngOnInit() {
    console.log("completeProdDetails", this.completeProdDetails);
    if(this.reviewed){
      this.ratingAct = this.completeProdDetails.rating;
      this.review.patchValue(this.completeProdDetails.review);
    }
   
  }

  changeRating(rating:number){
    this.ratingAct = rating
  }

  dismissModal(){
    this.modalController.dismiss()  
  }

  async submitReview(){
    const loader = await this.loadingController.create({
      message: 'Submitting Review'
    })

    loader.present()

    try{
      await this.dataQueries.submitReview(
        {
          rating       : this.ratingAct,
          review       : this.review.value,
          productId    : this.completeProdDetails.productId,
          name    : this.completeProdDetails.name,
          image    : this.completeProdDetails.image,
          variantIndex : this.completeProdDetails.variantIndex ?? null,
          type         : this.completeProdDetails.type ?? null,
          // variants : this.completeProdDetails.variants ?? null
        },
          this.completeProdDetails.productDetails
        )

      loader.dismiss()
      this.modalController.dismiss()
    }
    catch(err){
      console.log("err",err);
      
      loader.dismiss()
    }

   
  }

  
}
