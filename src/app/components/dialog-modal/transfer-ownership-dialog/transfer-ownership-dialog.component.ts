import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-transfer-ownership-dialog',
  templateUrl: './transfer-ownership-dialog.component.html',
  styleUrls: ['./transfer-ownership-dialog.component.css']
})
export class TransferOwnershipDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { email: string, requestOwnerEmail: string}, public dialogRef: MatDialogRef<TransferOwnershipDialogComponent>){ }
}
