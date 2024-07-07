import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-request-community-help',
  templateUrl: './request-community-help.component.html',
  styleUrls: ['./request-community-help.component.css']
})
export class RequestCommunityHelpComponent {
  videoTitle: string;
  subtitleTitle: string;
  language: string;
  deadlineOption = false;
  noDeadlineOption = false;
  deadlineDate: Date | null = null;
  today: string;

  constructor(public dialogRef: MatDialogRef<RequestCommunityHelpComponent>, @Inject(MAT_DIALOG_DATA) public data: any){
    this.videoTitle = data.videoTitle;
    this.subtitleTitle = data.subtitleTitle;
    this.language = data.language;
    this.today = new Date().toISOString().split('T')[0];
  }
}
