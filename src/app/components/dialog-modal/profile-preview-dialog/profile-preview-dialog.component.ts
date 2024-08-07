import {Component, Inject} from '@angular/core';
import {Observable, take} from "rxjs";
import {GmailUser, Rating} from "../../../models/firestore-schema/user.model";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {UserRights} from "../../../models/firestore-schema/subtitles.model";
import {UserService} from "../../../services/user.service";
import {ProfileService} from "../../../services/profile.service";
import {AuthService} from "../../../services/auth.service";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-profile-preview-dialog',
  templateUrl: './profile-preview-dialog.component.html',
  styleUrls: ['./profile-preview-dialog.component.css']
})
export class ProfilePreviewDialogComponent {
  user: GmailUser
  user$: Observable<GmailUser>;
  stars: number[] = [];
  averageRate: number = 0;
  ratingTooltip = '';
  givingRate = false;
  rateForm: FormGroup

  constructor(@Inject(MAT_DIALOG_DATA) private userData: UserRights[],
              private userService: UserService,
              private profileService: ProfileService,
              private auth: AuthService) {
    this.user$ = this.auth.user;
    this.user$.subscribe({
      next: data => {}
    });

    this.userService.getUserDetails(this.userData.find(user => user.right === 'Owner').userUid)
      .pipe(take(1))
      .subscribe(user => {
        this.user = user.data()
        this.profileService.getUserRatings(this.user.uid).subscribe({
          next: data => {this.loadRatings(data);}
        });
    });

    this.rateForm = new FormGroup({
      stars: new FormControl(''),
      comment: new FormControl('')
    })
  }

  loadRatings(data: Rating[]){
    let total = 0;
    let sum = 0;
    let index = 5
    this.stars = []

    for(let i = 0; i < data.length; i++){
      total++
      sum += data[i].rating
    }

    if(total > 0){
      this.averageRate = sum/total;
      if(this.averageRate > 5) {
        this.averageRate = 5;
      }

      let flagAvg = this.averageRate;
      this.ratingTooltip = `Your rating is: ${this.averageRate}`

      while(index > 0){
        if(flagAvg >= 1){
          this.stars.push(1)
        }else{
          if(flagAvg >= 0.5){
            this.stars.push(2)
          }else{
            this.stars.push(3)
          }
        }
        flagAvg--
        index--
      }
    }else{
      this.ratingTooltip = `You don't have been rated yet`
      for(let i = 0; i < 5; i++){
        this.stars.push(3)
      }
    }
  }

  rateUser(){
    this.givingRate = true;
  }
}
