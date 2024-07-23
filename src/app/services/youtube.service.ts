import {HttpClient} from '@angular/common/http';
import {Injectable, OnDestroy} from '@angular/core';
import {GOOGLE_API_KEY} from 'src/environments/environment';
import {YoutubeResponse, YoutubeVideoDetails} from '../models/youtube/youtube-response.model';
import {BehaviorSubject, map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class YoutubeService implements OnDestroy {
  playerRef: YT.Player;
  private currentTimeSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private currentCaption: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private timer: ReturnType<typeof setInterval>
  constructor(private http: HttpClient) { }

  playerRefSetter(player: YT.Player) {
    this.playerRef = player;
  }

  getAllVideoDetails(videoIdsPayload: string): Observable<YoutubeVideoDetails[]> {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&part=statistics&part=contentDetails&id=${videoIdsPayload}&key=${GOOGLE_API_KEY}`
    return this.http.get<YoutubeResponse>(url).pipe(
      map((res) => {
        if (res)
          return res.items;
        return;
      }
    ));
  }

  getVideoDetails(videoId: any): Observable<YoutubeVideoDetails> {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&part=statistics&part=contentDetails&id=${videoId}&key=${GOOGLE_API_KEY}`
    return this.http.get<YoutubeVideoDetails>(url)
  }

  getCaptionDetails(videoIdsPayload: string): Observable<YoutubeVideoDetails[]> {
    const videoIds = videoIdsPayload;
    const url = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoIds}&key=${GOOGLE_API_KEY}`
    return this.http.get<YoutubeResponse>(url).pipe(
      map((res) => {
        if (res)
          return res.items;
        return;
      }
    ));
  }

  getCurrentTime(): Observable<number> {
    return this.currentTimeSubject.asObservable();
  }

  getCurrentCaption(): Observable<string> {
    return this.currentCaption.asObservable();
  }

  startTimeTracking(): void {
    this.stopTimeTracking();
    this.timer = setInterval(() => {
      this.updateCurrentTime();
    }, 300);
  }

  stopTimeTracking(): void {
    clearInterval(this.timer);
  }

  updateCurrentTime(): void {
    const videoCurrentTime = this.playerRef.getCurrentTime();
    this.currentTimeSubject.next(videoCurrentTime);
  }

  updateCurrentCaption(caption: string): void {
    this.currentCaption.next(caption)
  }

  //point refers to point in seconds of video
  seekToPoint(point: number): void {
   if (this.playerRef.getPlayerState() === YT.PlayerState.PAUSED) {
      this.playerRef.seekTo(point, true);
    }
  }

  ngOnDestroy(): void {
    this.stopTimeTracking();
  }
}
