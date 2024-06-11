import {Component, Inject} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-confirmation',
  templateUrl: './dialog-confirmation.component.html',
  styleUrls: ['./dialog-confirmation.component.css']
})
export class DialogConfirmationComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data, public dialogRef: MatDialogRef<DialogConfirmationComponent>){ }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
