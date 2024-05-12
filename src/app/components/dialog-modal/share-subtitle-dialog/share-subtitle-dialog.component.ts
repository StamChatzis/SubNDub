import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-share-subtitle-dialog',
  templateUrl: './share-subtitle-dialog.component.html',
  styleUrls: ['./share-subtitle-dialog.component.css']
})
export class ShareSubtitleDialogComponent {
  filename: string;
  usersRights: string[];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { filename: string, usersRights: string[] },  private fb: FormBuilder)
  {
    this.filename = data.filename;
    this.usersRights = data.usersRights;
  }

  allOptions = [
    { label: 'Editor', value: 'Editor' },
    { label: 'Viewer', value: 'Viewer' },
    { label: 'Commenter', value: 'Commenter' },
    { label: 'Owner', value: 'Owner' },
    { label: 'Transfer Ownership', value: 'Transfer Ownership' },
    { label: 'Remove right', value: 'Remove right' }
  ];

  getOptions(selectedValue: string, index: number): any[] {
    if (selectedValue != 'Owner') {
      return this.allOptions.filter(option => option.value !== 'Owner');
    } else if (selectedValue === 'Owner') {
      return this.allOptions.filter(option => option.value == 'Owner');
    } else if (selectedValue === 'Transfer Ownership') {
      const ownerIndex = this.data.usersRights.findIndex(right => right['right'] === 'Owner');

      if (ownerIndex !== -1 && ownerIndex !== index) {
        this.data.usersRights[ownerIndex]['right'] = 'Editor';
        this.data.usersRights[index]['right'] = "Owner";
      }

      return this.allOptions.filter(option => option.value !== 'Transfer Ownership' && option.value !== 'Remove right');
    } else {
      return this.allOptions;
    }
  }


  onSelectionChange(event: any, index: number) {
    const selectedValue = event.value;

    if (selectedValue === 'Transfer Ownership') {
      const ownerIndex = this.data.usersRights.findIndex(right => right['right'] === 'Owner');

      if (ownerIndex !== -1 && ownerIndex !== index) {
        this.data.usersRights[ownerIndex]['right'] = 'Editor';
        this.data.usersRights[index]['right'] = "Owner";
      }
    }
    
  }

}
