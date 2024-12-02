import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-viewonly-mode-dialog',
  templateUrl: './viewonly-mode-dialog.component.html',
  styleUrls: ['./viewonly-mode-dialog.component.css']
})
export class ViewonlyModeDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { displayName: string}, public dialogRef: MatDialogRef<ViewonlyModeDialogComponent>){ }
}
