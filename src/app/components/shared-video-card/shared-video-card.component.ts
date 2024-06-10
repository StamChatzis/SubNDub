import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { YoutubeVideoDetails } from 'src/app/models/youtube/youtube-response.model';

@Component({
  selector: 'app-shared-video-card',
  templateUrl: './shared-video-card.component.html',
  styleUrls: ['./shared-video-card.component.css']
})
export class SharedVideoCardComponent {
  @Input() videoId: string
  @Input() videoDetails: YoutubeVideoDetails;
  @Input() sharedVideoDetails: any;
  @Output() editVideoEmitter: EventEmitter<any> = new EventEmitter<any>;
  @Output() deleteVideoEmitter: EventEmitter<string> = new EventEmitter<string>;
  @Output() sharedVideoEmitter: EventEmitter<string> = new EventEmitter<string>;
  @Output() videoIdEmitter: EventEmitter<string> = new EventEmitter<string>;

  publishDate: string;

  constructor() { }

  ngOnInit(): void {
    this.publishDate = this.timeSince(new Date(this.videoDetails?.snippet?.publishedAt));
  }

  editVideo(requestDetails: any): void {
    this.editVideoEmitter.emit(requestDetails);
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
