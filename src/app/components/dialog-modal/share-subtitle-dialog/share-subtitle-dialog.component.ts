import { Component, Inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TransferOwnershipDialogComponent } from 'src/app/components/dialog-modal/transfer-ownership-dialog/transfer-ownership-dialog.component';
import {DetailsViewServiceService, SubtitleFormat} from 'src/app/services/details-view-service.service';
import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { take } from 'rxjs';
import { ShareService } from 'src/app/services/share.service';

@Component({
  selector: 'app-share-subtitle-dialog',
  templateUrl: './share-subtitle-dialog.component.html',
  styleUrls: ['./share-subtitle-dialog.component.css'],
  providers: [DetailsViewServiceService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShareSubtitleDialogComponent implements OnInit {
  filename: string;
  usersRights: string[];
  videoId: string;
  ISOcode: string;
  language: string;
  owner_text: string;
  format: SubtitleFormat;
  movedUsersRights = [];
  requestOwnerEmail: string;
  videoTitle: string;
  subtitleId: any;
  canEdit: boolean = false;
  sendNotificationValue: boolean = false;
  sendNotification: boolean = false;

  constructor(public dialogRef: MatDialogRef<ShareSubtitleDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { filename: string, usersRights: string[], videoId: string, ISOcode, language, owner_text, format, videoTitle, subtitleId, userEmail},  
  private fb: FormBuilder, 
  private detailsViewService: DetailsViewServiceService,
  public dialog: MatDialog,
  private shareService: ShareService
  )

  {
    this.filename = data.filename;
    this.usersRights = data.usersRights;
    this.videoId = data.videoId;
    this.ISOcode = data.ISOcode;
    this.language = data.language;
    this.owner_text = data.owner_text;
    this.format = data.format;
    this.requestOwnerEmail = data.owner_text;
    this.videoTitle = data.videoTitle;
    this.subtitleId = data.subtitleId;
  }

  ngOnInit() {
    const ownerIndex = this.data.usersRights.findIndex(right => right['right'] === 'Owner');
    if (ownerIndex !== -1) {
      this.movedUsersRights = [this.data.usersRights[ownerIndex]].concat(this.data.usersRights.slice(0, ownerIndex)).concat(this.data.usersRights.slice(ownerIndex + 1));
    } else {
      this.movedUsersRights = this.data.usersRights;
    }

    const ownerEmail = this.movedUsersRights.filter(user => user['right'] == "Owner")[0]['userEmail'];
    if (ownerEmail == this.data.userEmail){
      this.canEdit = true;
    }
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
    } else {
      return this.allOptions;
    }
  }


  onSelectionChange(event: any, index: number) { 
    const selectedValue = event.value;
    const selectedEmail = this.movedUsersRights[index]['userEmail'];
    if (selectedValue === 'Transfer Ownership') {
      const ownerEmail = this.movedUsersRights.filter(user => user['right'] == "Owner")[0]['userEmail'];
      this.resetUserRight(selectedEmail, index).then(() => {
        this.transferOwnershipPrompt(selectedEmail, index, ownerEmail);
      });
    }
  }

  transferOwnershipPrompt(email: string, index: number, ownerEmail: string): void {
    const dialogRef= this.dialog.open(TransferOwnershipDialogComponent, {width:'400px', data: {email, requestOwnerEmail: this.requestOwnerEmail}, scrollStrategy: new NoopScrollStrategy()});
    dialogRef.afterClosed().pipe(take(1)).subscribe((transferFlag) => {
      if(transferFlag == (null || undefined)){ this.resetUserRight(email,index); }
      else if(transferFlag){
        if (transferFlag.email) {
          this.detailsViewService.transferOwnership(ownerEmail, transferFlag.email, this.data.filename, this.videoId, this.ISOcode, this.language, this.data.format, this.videoTitle, this.subtitleId);
          this.dialog.closeAll();
        }
      }
      
    });
  }

  resetUserRight(userEmail: string, index: number): Promise<void> {
    return new Promise((resolve) => {
      this.detailsViewService.resetUserRightByEmail(userEmail, this.filename, this.videoId, this.ISOcode, this.language, this.subtitleId).then((previousRight) => {
        this.movedUsersRights[index]['right'] = previousRight.toString();
        resolve();
      });
    });
    
  }
}
