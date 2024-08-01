import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-download-options-dialog',
  templateUrl: './download-options-dialog.component.html',
  styleUrls: ['./download-options-dialog.component.css']
})

export class DownloadOptionsDialogComponent {
  srtChecked = false;
  sbvChecked = false;
  atLeastOne = false;
  returnValue= ''
  format: string
  typeForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) private subName: string) {
    this.typeForm = new FormGroup({
      srt: new FormControl(false),
      sbv: new FormControl(false)
    })

    if(subName){
      this.format = subName.split('.')[1]
      switch (this.format){
        case 'srt':
          this.typeForm.controls['srt'].setValue(true)
          this.srtChecked = !this.srtChecked;
          break
        case 'sbv':
          this.typeForm.controls['sbv'].setValue(true)
          this.sbvChecked = !this.sbvChecked;
          break
      }
      this.atLeastOne = this.srtChecked || this.sbvChecked;
      this.setUpReturnValue();
    }
  }

  onChecked(type: string){
    switch (type){
      case 'srt':
        this.srtChecked = !this.srtChecked;
        break
      case 'sbv':
        this.sbvChecked = !this.sbvChecked;
        break
    }
    this.atLeastOne = this.srtChecked || this.sbvChecked;

    this.setUpReturnValue();
  }

  setUpReturnValue(){
    if(this.sbvChecked && this.srtChecked){
      this.returnValue = 'both'
    }else if(this.srtChecked && !this.sbvChecked){
      this.returnValue = 'srt'
    }else if(!this.srtChecked && this.sbvChecked){
      this.returnValue = 'sbv'
    }else{
      this.returnValue = ''
    }
  }
}
