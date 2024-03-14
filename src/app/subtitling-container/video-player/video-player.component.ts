import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { YoutubeService } from 'src/app/services/youtube.service';
@Component({
  selector: 'video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  apiLoaded = false;
  playerReady: boolean = false;
  @Input() captionsPreview: string;
  @Input() videoId: string;

  constructor(private youtube: YoutubeService) {}

  ngOnInit(): void {
    if (!this.apiLoaded) {
      // This code loads the IFrame Player API code asynchronously, according to the instructions at
      // https://developers.google.com/youtube/iframe_api_reference#Getting_Started
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.apiLoaded = true;
    }
  }

  playerLoaded(playerEvent: YT.PlayerEvent): void {
    this.playerReady = true;
    this.youtube.playerRefSetter(playerEvent.target);
  }

  handleState(event: YT.OnStateChangeEvent): void {
    if (event.data === 1) {
      this.youtube.startTimeTracking();
    } else if (event.data === 2) {
      this.youtube.stopTimeTracking();
    }
  }

  ngOnDestroy(): void {
    this.youtube.stopTimeTracking();
    this.youtube.updateCurrentCaption(null);
  }
}
