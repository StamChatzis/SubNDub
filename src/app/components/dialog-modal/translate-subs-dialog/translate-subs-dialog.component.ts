import { Component } from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-translate-subs-dialog',
  templateUrl: './translate-subs-dialog.component.html',
  styleUrls: ['./translate-subs-dialog.component.css']
})
export class TranslateSubsDialogComponent {
  radioBtnForm: FormGroup;

  constructor() {
    this.radioBtnForm = new FormGroup({
      radioBtn: new FormControl("1")
    })

    this.radioBtnForm.controls['radioBtn'].setValue("1")
  }

  onSelection(){
    console.log("mpou")
  }
}
