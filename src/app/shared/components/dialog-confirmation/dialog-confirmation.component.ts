import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-confirmation',
  templateUrl: './dialog-confirmation.component.html',
  styleUrls: ['./dialog-confirmation.component.css']
})
export class DialogConfirmationComponent {

  constructor(public dialogRef: MatDialogRef<DialogConfirmationComponent>){ }

  onNoClick(): void {
    this.dialogRef.close();
  }
  
}
