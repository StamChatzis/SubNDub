import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {BehaviorSubject, Observable, take, tap} from "rxjs";
import {GmailUser, Rating} from "../../models/firestore-schema/user.model";
import {AuthService} from "../../services/auth.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ProfileService} from "../../services/profile.service";
import {SupportedLanguages} from "../../models/google/google-supported-languages";
import {Country} from "../../models/google/google-supported-countries";
import {GoogleTranslateService} from "../../services/googletranslate.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatTableDataSource} from "@angular/material/table";
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
  row: number = -1;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  availableLanguages$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject<SupportedLanguages>(null);
  countries?: Country[];
  skillLevels?: SkillLevel[];
  stars: number[] = [];
  averageRate: number = 0;
  ratingTooltip = '';
  foreignLanguages: ForeignLanguage[] = [];
  deletedLang: ForeignLanguage[] = [];
  userInfoForm: FormGroup;
  langSkillsForm: FormGroup;
  motherLangForm: FormGroup;
  langSkillDataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['language', 'skill', 'options'];
  editedProfileDetails: boolean;
  addLang: boolean;
  editLang: boolean;

  constructor(public auth: AuthService,
              public proService: ProfileService,
              private googleLangService: GoogleTranslateService,
              private snackbar: MatSnackBar,
              public dialog: MatDialog) {
    this.userInfoForm = new FormGroup({
      displayName: new FormControl( '', [Validators.required, Validators.pattern(/^[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ0-9\s]*$/)]),
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
    this.addLang = false;
    this.editLang = false;
    this.user$ = this.auth.user;
  }

  ngOnInit() {
    this.user$.subscribe({
      next: data => {
        this.loadUserDetails(data);
        this.uid = data.uid;
        this.photoUrl = data.photoURL;
        this.email = data.email;
        this.loadUserRatings(data.uid)
        this.proService.getAllLanguages(data.uid).subscribe({
          next: data => {
            this.loadForeignLanguages(data)
          }
        });
      }
    });

    this.proService.getCountries().subscribe({
      next: data => {this.loadCountries(data);}
    });

    this.proService.getSkillLevels().subscribe({
      next: data => {this.loadSkillLevels(data)}
    });

    this.getAvailableLanguages();
  }

  isEdited(){
    this.editedProfileDetails = true;
  }

  loadUserDetails(data: any){
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

  loadUserRatings(data: any) {
    this.proService.getUserRatings(data).subscribe({
      next: data => {
        this.loadRatings(data);
      }
    });
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

  loadCountries(data: any): void {
    this.countries = data;
  }

  loadSkillLevels(data: any): void {
    this.skillLevels = data;
  }

  loadForeignLanguages(data: any): void {
    this.foreignLanguages = data;
    this.updateForeignLangData()
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

  onClickToAddLang(){
    this.addLang = true;
    this.langSkillsForm.controls['lang'].setValue('0');
    this.langSkillsForm.controls['skill'].setValue('0');
  }

  onClickToEditLang(row: any){
    this.row = row;
    this.editLang = true;
    this.langSkillsForm.controls['lang'].setValue(this.foreignLanguages[row].language);
    this.langSkillsForm.controls['skill'].setValue(this.foreignLanguages[row].level);
  }

  onClickToDeleteLang(row: any){
    this.editedProfileDetails = true;
    const del = {
      language: this.foreignLanguages[row].language,
      level: this.foreignLanguages[row].level
    };
    this.deletedLang.push(del);
    this.foreignLanguages.splice(row, 1);
    this.updateForeignLangData();
  }

  onClickToSaveNewLanguage(){
    this.editedProfileDetails = true;
    const newLang = {
      language: this.langSkillsForm.value.lang,
      level: this.langSkillsForm.value.skill
    };

    if(this.editLang){
      this.foreignLanguages.splice(this.row, 1);
    }

    this.foreignLanguages.push(newLang);

    this.langSkillsForm.controls['lang'].setValue('0');
    this.langSkillsForm.controls['skill'].setValue('0');
    this.editLang = false;
    this.addLang = false;
    this.updateForeignLangData();
  }

  cancelAddEdit(){
    this.langSkillsForm.controls['lang'].setValue('0');
    this.langSkillsForm.controls['skill'].setValue('0');
    this.addLang = false;
    this.editLang = false;
  }

  updateForeignLangData(): void {
    this.langSkillDataSource.data = [...this.foreignLanguages];
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

    if(this.saveNewLangData()){
      this.deletedLang = [];
      this.proService.updateProfile(updatedUser)
        .then(rtn => {
          this.snackbar.open('Profile has been updated successfully!','OK', {duration:5000});
        }).catch(ex => {
        this.snackbar.open('Problem with saving your profile settings!', 'OK', {duration:5000});
        console.log(ex.message)
      })
    }
  }

  saveNewLangData(){
    if (this.proService.addForeignLanguages(this.uid, this.foreignLanguages)) {
      this.editedProfileDetails = false;
      for(let del of this.deletedLang){
        this.proService.deleteForeignLang(this.uid, del.language)
          .catch(ex => {
            this.snackbar.open('Problem with saving your foreign language settings!', 'OK', {duration:5000});
            console.log(ex.message)
            return false
          })
      }
      return true;
    }else{
      this.snackbar.open('Problem with saving your foreign language settings!', 'OK', {duration:5000});
      return false;
    }
  }

  revertChanges(){
    this.ngOnInit()
    this.editedProfileDetails = false;
  }

}
