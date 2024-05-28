import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { GmailUser, User } from "../../models/firestore-schema/user.model";
import { AuthService } from "../../services/auth.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ProfileService } from "../../services/profile.service";
import { SupportedLanguages } from "../../models/google/google-supported-languages";
import { Country } from "../../models/google/google-supported-countries";
import { GoogleTranslateService } from "../../services/googletranslate.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from "@angular/material/table";
import {ForeignLanguage, SkillLevel} from "../../models/general/language-skills";
import {MatDialog} from "@angular/material/dialog";

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
  otherLanguages: ForeignLanguage[] = [];
  skills: SkillLevel;
  userInfoForm: FormGroup;
  langSkillsForm: FormGroup;
  motherLangForm: FormGroup;
  langSkillDataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['language', 'skill', 'options'];
  editedProfileDetails: boolean;
  addingLang: boolean;

  constructor(private router: Router,
              public auth: AuthService,
              public proService: ProfileService,
              private googleLangService: GoogleTranslateService,
              private snackbar: MatSnackBar,
              public dialog: MatDialog) {
    this.userInfoForm = new FormGroup({
      displayName: new FormControl( '', [Validators.required, Validators.pattern(/^[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ\s]*$/)]),
      email: new FormControl( {value: '', disabled: true}, [Validators.required, Validators.email]),
      ethnicity: new FormControl(''),
      bio: new FormControl('')
    });
    this.motherLangForm = new FormGroup({
      motherLang: new FormControl('')
    });
    this.langSkillsForm = new FormGroup({
      lang: new FormControl('', [Validators.required]),
      skill: new FormControl('', [Validators.required]),
    });
    this.editedProfileDetails = false;
    this.addingLang = false;
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
    });

    this.proService.getCountries().subscribe({
      next: data => {this.loadCountries(data);}
    });

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
    if(data.mother_language == null || data.mother_language == ''){
      this.motherLangForm.controls['motherLang'].setValue('0');
    }else{
      this.motherLangForm.controls['motherLang'].setValue(data.mother_language);
    }
  }

  loadCountries(data: any): void {
    this.countries = data;
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

  addNewLanguage(){
    this.addingLang = true;
  }

  saveNewLang(){
    const newLang = {
      language: this.langSkillsForm.value.lang,
      level: this.langSkillsForm.value.skill
    };
    this.otherLanguages.push(newLang);
    this.addingLang = false;
  }

  cancelAdd(){
    this.addingLang = false;
  }

  saveChanges(): void{
    const updatedUser = {
      uid: this.uid,
      displayName: this.userInfoForm.value.displayName,
      ethnicity: ((this.userInfoForm.controls['ethnicity'].value == 0) ? '' : this.userInfoForm.controls['ethnicity'].value),
      bio: ((this.userInfoForm.value.bio == undefined) ? '' : this.userInfoForm.value.bio),
      photoURL: this.photoUrl,
      email: this.email,
      mother_language: ((this.motherLangForm.controls['motherLang'].value == 0) ? '' : this.motherLangForm.value.motherLang)
    }

    this.proService.updateProfile(updatedUser)
      .then(rtn => {
      this.snackbar.open('Profile has been updated successfully!','OK', {duration:5000});
    })

    this.editedProfileDetails = false;
  }
}
