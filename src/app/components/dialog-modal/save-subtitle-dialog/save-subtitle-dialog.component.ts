import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {BehaviorSubject, tap} from "rxjs";
import {SupportedLanguages} from "../../../models/google/google-supported-languages";
import {GoogleTranslateService} from "../../../services/googletranslate.service";
import {DetailsViewServiceService} from "../../../services/details-view-service.service";

@Component({
  selector: 'app-save-subtitle-dialog',
  templateUrl: './save-subtitle-dialog.component.html',
  styleUrls: ['./save-subtitle-dialog.component.css'],
  providers: [GoogleTranslateService, DetailsViewServiceService]
})
export class SaveSubtitleDialogComponent implements OnInit{
  supportedLanguages$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject<SupportedLanguages>(null);
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  newSubForm: FormGroup
  langIsSelected: boolean = false;

  constructor(private translateService: GoogleTranslateService, private fb: FormBuilder) {
    this.newSubForm = new FormGroup({
      language: new FormControl('', Validators.required),
      name: new FormControl('', Validators.required),
      format: new FormControl('', Validators.required),
    })
  }

  ngOnInit(){
    this.getSupportedLanguages();
  }

  getSupportedLanguages(): void {
    this.translateService.getSupportedLanguages()
      .pipe(tap(() => {
        this.loading$.next(true)
      }))
      .subscribe((response: SupportedLanguages) => {
        this.supportedLanguages$.next(response);
        this.loading$.next(false)
      });
  }

  isSelected(){
    this.langIsSelected = this.newSubForm.controls['language'].value != '0';
  }
}
