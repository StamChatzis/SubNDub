import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {Observable} from "rxjs";
import {Language} from "../../../models/google/google-supported-languages";

@Component({
  selector: 'app-detect-language-dialog',
  templateUrl: './detect-language-dialog.component.html',
  styleUrls: ['./detect-language-dialog.component.css']
})

export class DetectLanguageDialogComponent {
  langName = ''
  targetLanguage: string

  constructor(@Inject(MAT_DIALOG_DATA) private data: Observable<Language>) {
    if(this.data){
      data.subscribe(lang => {
        this.langName = lang.name;
        this.targetLanguage = lang.language
      })
    }
  }

}
