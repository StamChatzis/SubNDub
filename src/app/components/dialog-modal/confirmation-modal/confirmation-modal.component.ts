import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: TextConfirmation) {}

}

export interface TextConfirmation {
  current_text: string;
  new_text: string;
}