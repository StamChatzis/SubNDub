import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, tap } from "rxjs";
import {GmailUser, User} from "../../models/firestore-schema/user.model";
import { AuthService } from "../../services/auth.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ProfileService } from "../../services/profile.service";
import { SupportedLanguages } from "../../models/google/google-supported-languages";
import { Country } from "../../models/google/google-supported-countries";
import { GoogleTranslateService } from "../../services/googletranslate.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [GoogleTranslateService]
})

export class ProfileComponent implements OnInit{
  user$: Observable<GmailUser>;
  uid: string;
  photoUrl: string;
  email: string;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  availableLanguages$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject<SupportedLanguages>(null);
  countries?: Country[];
  userInfoForm: FormGroup;
  langSkillsForm: FormGroup;
  editedProfileDetails: boolean;

  constructor(private router: Router, public auth: AuthService, public proService: ProfileService, private googleLangService: GoogleTranslateService) {
    this.userInfoForm = new FormGroup({
      displayName: new FormControl( '', [Validators.required, Validators.pattern(/^[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ\s]*$/)]),
      email: new FormControl( {value: '', disabled: true}, [Validators.required, Validators.email]),
      ethnicity: new FormControl(''),
      bio: new FormControl(''),
    })
    this.langSkillsForm = new FormGroup({
      lang: new FormControl(''),
      skill: new FormControl(''),
      motherLanguage: new FormControl('')
    })
    this.editedProfileDetails = false;
  }

  ngOnInit() {
    this.user$ = this.auth.user;
    this.user$.subscribe({
      next: data => {
        this.loadUser(data);
        this.uid = data.uid;
        this.photoUrl = data.photoURL;
        this.email = data.email;
      }
    })
    this.proService.getCountries().subscribe({
      next: data => {this.loadCountries(data);}
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
    if(data.ethnicity == null || data.ethnicity == ''){
      this.userInfoForm.controls['ethnicity'].setValue('0');
    }else{
      this.userInfoForm.controls['ethnicity'].setValue(data.ethnicity);
    }
  }

  loadCountries(data: any): void {
    this.countries = data;
  }

  loadLanguages(data: any): void {

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
    const updatedUser = {
      uid: this.uid,
      displayName: this.userInfoForm.value.displayName,
      ethnicity: this.userInfoForm.controls['ethnicity'].value,
      bio: this.userInfoForm.value.bio,
      photoURL: this.photoUrl,
      email: this.email
    }
    updatedUser.displayName = this.userInfoForm.value.displayName;
    if (this.userInfoForm.controls['ethnicity'].value == 0) {
      updatedUser.ethnicity = ''
    }else {
      updatedUser.ethnicity = this.userInfoForm.controls['ethnicity'].value;
    }
    if (this.userInfoForm.value.bio == undefined){
      updatedUser.bio = ''
    }else{
      updatedUser.bio = this.userInfoForm.value.bio;
    }

    this.proService.updateProfile(updatedUser).then(rtn => {
      console.log("Successfully updated profile");
    })

    this.editedProfileDetails = false;
  }
}
