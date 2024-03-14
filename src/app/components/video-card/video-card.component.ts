import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { YoutubeVideoDetails } from 'src/app/models/youtube/youtube-response.model';

@Component({
  selector: 'video-card',
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.css']
})
export class VideoCardComponent implements OnInit {
  @Input() videoId: string
  @Input() videoDetails: YoutubeVideoDetails;
  @Output() editVideoEmitter: EventEmitter<string> = new EventEmitter<string>;
  @Output() deleteVideoEmitter: EventEmitter<string> = new EventEmitter<string>;
  @Output() videoIdEmitter: EventEmitter<string> = new EventEmitter<string>;


  publishDate: string;

  constructor() { }

  ngOnInit(): void {
    this.publishDate = timeSince(new Date(this.videoDetails?.snippet?.publishedAt));
  }

  editVideo(id: string): void {
    this.editVideoEmitter.emit(id);
  }

  deleteVideo(id: string): void {
    this.deleteVideoEmitter.emit(id);
  }

  emitVideoId(id: string): void {
    this.videoIdEmitter.emit(id);
  }
}


export function timeSince(date: Date): string {

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