import {Component, Inject} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {CharacterAssign} from "../../../models/general/person-assign.model";
import {BehaviorSubject, Observable, tap} from "rxjs";
import {Language, SupportedLanguages} from "../../../models/google/google-supported-languages";
import {GoogleTranslateService} from "../../../services/googletranslate.service";

@Component({
  selector: 'app-translate-subs-dialog',
  templateUrl: './translate-subs-dialog.component.html',
  styleUrls: ['./translate-subs-dialog.component.css']
})
export class TranslateSubsDialogComponent {
  _supportedLanguages$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject<SupportedLanguages>(null);
  form: FormGroup;
  targetLang: string;
  selectedLang: string;
  langName: string;
  disabledBtn: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) private data: Observable<Language>,
              private google: GoogleTranslateService){
    if(this.data){
      data.subscribe(lang => {
        this.targetLang = lang.language;
        this.selectedLang = lang.language;
        this.langName = lang.name;
      })
    }

    this.form = new FormGroup({
      radioBtn: new FormControl("1"),
      selectedLang: new FormControl(""),
    })

    this.form.get('selectedLang').disable()

    this.getSupportedLanguages()
  }

  get supportedLanguages$(): Observable<SupportedLanguages> {
    return this._supportedLanguages$;
  }

  getSupportedLanguages(): void {
    this.google.getSupportedLanguages()
      .pipe(tap(() => {
      }))
      .subscribe((response: SupportedLanguages) => {
        this._supportedLanguages$.next(response);
      });
  }

  onChangeRadioButton(){
    if(this.form.controls['radioBtn'].value == '2'){
      this.disabledBtn = true
      this.form.get('selectedLang').enable()
      this.form.controls['selectedLang'].setValue('');
    }else{
      this.selectedLang = this.targetLang;
      this.disabledBtn = false
      this.form.get('selectedLang').disable()
    }
  }

  selectLanguage(lang: string){
    if(lang){
      this.disabledBtn = false
      this.selectedLang = lang
    }
  }
}
