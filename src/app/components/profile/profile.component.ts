import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { GmailUser } from "../../models/firestore-schema/user.model";
import { AuthService } from "../../services/auth.service";
import { FormControl, FormGroup, Validators} from "@angular/forms";
import { ProfileService } from "../../services/profile.service";
import { SupportedLanguages } from "../../models/google/google-supported-languages";
import { GoogleTranslateService } from "../../services/googletranslate.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [GoogleTranslateService]
})

export class ProfileComponent implements OnInit{
  user$: Observable<GmailUser>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  availableLanguages$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject<SupportedLanguages>(null);
  userInfoForm: FormGroup;
  langSkillsForm: FormGroup;
  editedProfileDetails: boolean = false;
  langData: any[];

  constructor(private router: Router, public auth: AuthService, public proService: ProfileService, private googleLangService: GoogleTranslateService) {
    this.userInfoForm = new FormGroup({
      displayName: new FormControl( '', [Validators.required, Validators.pattern(/^[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ\s]*$/)]),
      email: new FormControl( '', [Validators.required, Validators.email]),
      ethnicity: new FormControl(''),
      bio: new FormControl('')
    })
    this.langSkillsForm = new FormGroup({
      lang: new FormControl(''),
      skill: new FormControl('')
    })
  }

  ngOnInit() {
    this.user$ = this.auth.user;
    this.user$.subscribe({
      next: data => {
        this.loadUser(data);
      },
      error: error => {}
    })
    this.getAvailableLanguages();
  }

  isEdited(){
    this.editedProfileDetails = true;
  }

  loadUser(data: any){
    this.userInfoForm.controls['displayName'].setValue(data.displayName);
    this.userInfoForm.controls['email'].setValue(data.email);
    this.userInfoForm.controls['bio'].setValue(data.bio);
    if(data.ethnicity != null){
      this.userInfoForm.controls['ethnicity'].setValue(data.ethnicity);
    }else{
      this.userInfoForm.controls['ethnicity'].setValue('0');
    }
  }

  getAvailableLanguages(): void {
    this.googleLangService.getSupportedLanguages()
      .pipe(tap(() => {
        this.loading$.next(true)
      }))
      .subscribe((response: SupportedLanguages) => {
        this.availableLanguages$.next(response);
        this.loading$.next(false)
      });
  }

  saveChanges(): void{
   this.editedProfileDetails = false;
  }

}
