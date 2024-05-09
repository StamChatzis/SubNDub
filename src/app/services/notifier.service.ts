import { Injectable } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotifierService {

  constructor(private snackbar: MatSnackBar) { }

  showNotification(displayMessage: string, buttonText: string){
    this.snackbar.open(displayMessage, buttonText, {
      duration:5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
