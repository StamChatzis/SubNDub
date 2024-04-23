import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { GmailUser } from "../../models/firestore-schema/user.model";
import { AuthService } from "../../services/auth.service";
import { FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})

export class ProfileComponent implements OnInit{
  user$: Observable<GmailUser>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  userInfoForm: FormGroup;
  editedProfileDetails: boolean = false;

  constructor(private router: Router, public auth: AuthService) {
    this.userInfoForm = new FormGroup({
      displayName: new FormControl( '', [Validators.required, Validators.pattern(/^[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ\s]*$/)]),
      email: new FormControl( '', [Validators.required, Validators.email])
    })
  }

  ngOnInit() {
    this.user$ = this.auth.user;
    this.user$.subscribe({
      next: data => {

      },
      error: error => {console.log(error)}
    })
  }

  isEdited(){
    this.editedProfileDetails = true;
  }
}
