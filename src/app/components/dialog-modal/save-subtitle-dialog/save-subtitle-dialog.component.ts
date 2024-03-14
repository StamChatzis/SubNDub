import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-save-subtitle-dialog',
  templateUrl: './save-subtitle-dialog.component.html',
  styleUrls: ['./save-subtitle-dialog.component.css']
})
export class SaveSubtitleDialogComponent{
  
  constructor(@Inject(MAT_DIALOG_DATA) public data,private fb: FormBuilder) { }

}
