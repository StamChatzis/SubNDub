import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { YoutubeVideoDetails } from 'src/app/models/youtube/youtube-response.model';
import { PlaceABidComponent } from '../dialog-modal/place-a-bid/place-a-bid.component';
import { MatDialog } from '@angular/material/dialog';
import { NotifierService } from 'src/app/services/notifier.service';
import { take } from 'rxjs';
import { EditRequestDialogComponent } from '../dialog-modal/edit-request-dialog/edit-request-dialog.component';

@Component({
  selector: 'community-video-card',
  templateUrl: './community-video-card.component.html',
  styleUrls: ['./community-video-card.component.css']
})
export class CommunityVideoCardComponent implements OnInit {
  @Input() videoId: string;
  @Input() userEmail: string;
  @Input() userId: string;
  @Input() videoDetails: YoutubeVideoDetails;
  @Input() communityRequestDetails: any;
  @Output() editVideoEmitter: EventEmitter<any> = new EventEmitter<any>;
  @Output() deleteVideoEmitter: EventEmitter<string> = new EventEmitter<string>;
  @Output() requestCommunityHelpEmitter: EventEmitter<string> = new EventEmitter<string>;

  requestCreationDate: any;
  publishDate: string;

  constructor(public dialog: MatDialog, private notifier: NotifierService) { }

  ngOnInit(): void {
    this.publishDate = this.timeSince(new Date(this.videoDetails?.snippet?.publishedAt));
    this.convertTimestamp();
  }

  convertTimestamp(){
    let timestamp_ms = this.communityRequestDetails.timestamp;
    let date = new Date(timestamp_ms);
    let dateOnly = date.toISOString().split('T')[0];  
    this.requestCreationDate = dateOnly;
  }

  editVideo(requestDetails: any): void {
    this.editVideoEmitter.emit(requestDetails);
  }

  openPlaceABid(requestDetails: any, videoTitle: string, filename: string): void {
    this.dialog.open(PlaceABidComponent,{width:'550px', height: '470px', data: { language:requestDetails.language, videoTitle, videoId: this.videoId, requestedByID: requestDetails.requestedByID, filename, requestDetails, userEmail:this.userEmail}}).afterClosed().pipe(take(1)).subscribe(dialog => {
      if (dialog === null || dialog ==undefined ){ 
        this.dialog.closeAll();
      }else if (dialog && dialog.yourBidAmount>0) {
        this.notifier.showNotification("Offer has been successfully sent to the requestor.","OK");
      }
      
    });
  }

  editCommunityRequest(requestDetails: any, videoTitle: string, filename: string): void {
    this.dialog.open(EditRequestDialogComponent,{width:'550px', height: '480px', data: { language:requestDetails.language, videoTitle, videoId: this.videoId, requestedByID: requestDetails.requestedByID, filename, requestDetails, userEmail:this.userEmail}}).afterClosed().pipe(take(1)).subscribe(dialog => {
      if (dialog === null || dialog === undefined ){ 
        this.dialog.closeAll();
      }else if (dialog ) {
        if(dialog.isChecked == true)
          this.notifier.showNotification("Request has been successfully closed.","OK");
        if(dialog.newDeadline !== null){
          this.notifier.showNotification("Dealine for this request has been updated.","OK");
        }
      }
      
    });
  }

  timeSince(date: Date): string {

    let seconds = Math.floor((new Date().valueOf() - date.valueOf()) / 1000);
  
    let interval = seconds / 31536000;
  
    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  }
}


