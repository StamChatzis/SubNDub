import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-share-subtitle-dialog',
  templateUrl: './share-subtitle-dialog.component.html',
  styleUrls: ['./share-subtitle-dialog.component.css']
})
export class ShareSubtitleDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data, private fb: FormBuilder){}
}
