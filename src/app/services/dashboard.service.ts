import { Injectable, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, map, of, switchMap, take } from 'rxjs';
import { GmailUser, Video } from '../models/firestore-schema/user.model';
import { AuthService } from './auth.service';
import { YoutubeVideoDetails } from '../models/youtube/youtube-response.model';
import { SharedVideo } from 'src/app/models/firestore-schema/shared-video.model';

@Injectable({
  providedIn: 'root'
})

export class DashboardService {
  userVideos$: Observable<Video[]>;
  sharedVideos$: Observable<SharedVideo[]>;
  communityVideos$: Observable<Video[]>;

  get getUserVideos(): Observable<Video[]> {
    return this.userVideos$;
  }

  get getUserSharedVideos(): Observable<SharedVideo[]> {
    return this.sharedVideos$;
  }

  get communityVideos(): Observable<Video[]> {
    return this.communityVideos$;
  }

  constructor(private firestore: AngularFirestore, private auth: AuthService) {}

  getVideos(userId: any): Observable<Video[]> {
    return this.userVideos$ = this.firestore.collection<Video>(`users/${userId}/videos/`).valueChanges();
  }

  getSharedVideos(email: any): Observable<SharedVideo[]> {
    return this.firestore.collection<SharedVideo>('sharedVideos').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as SharedVideo;
          const id = a.payload.doc.id;
          const owner = data.usersRights.find(right => right.right === 'Owner')?.userEmail;
          return { id,...data, owner };
        }).filter(video => {
          return video.usersRights.some(right => right.userEmail === email);
        });
      }),
      map(videos => [...new Map(videos.map(video => [video.videoId, video])).values()])
    );
  }

  getCommunityVideos(): Observable<Video[]> {
    return this.firestore.collection<Video>('helpRequests', ref => ref.where('status', '==', 'open')).snapshotChanges().pipe(
      switchMap(requests => {
        if (requests.length) {
          return combineLatest(
            requests.map(request => {
              const requestId = request.payload.doc.id;
              const videoId = request.payload.doc.data().videoId;

              // Assuming you need to fetch additional data related to the video
              return this.firestore.collection('videos').doc(videoId).snapshotChanges().pipe(
                map(() => {
                  return {
                    requestId,
                    ...request.payload.doc.data(),
                  };
                })
              );
            })
          );
        } else {
          return of([]);
        }
      }),
      map(requestsWithVideoDetails => requestsWithVideoDetails.flat())
    );
  }

  addVideo(video: any, userUid: string): void {
    const userRef: AngularFirestoreDocument<Video> = this.firestore.doc(`users/${userUid}/videos/${video.items[0].id}`);
    const videoData = {
      videoId: video.items[0].id,
      title: video.items[0].snippet.title
    }

    userRef.set(videoData);
    this.userVideos$ = this.firestore.collection<Video>(`users/${userUid}/videos/`).valueChanges();
  }

  updateVideo(videoDetails: YoutubeVideoDetails, userUid: string): void {
    const userRef: AngularFirestoreDocument<GmailUser> = this.firestore.doc(`users/${userUid}`);

    const data = {
      videoId: videoDetails.id,
      title: videoDetails.snippet.title,
      channel: videoDetails.snippet.channelTitle,
      views: videoDetails.statistics.viewCount,
      published: videoDetails.snippet.publishedAt
    };

    userRef.collection('videos').doc(videoDetails.id).update(data);
  }

  deleteVideo(videoId: string, userUid: string): void {
    const userRef: AngularFirestoreDocument<GmailUser> = this.firestore.doc(`users/${userUid}/videos/${videoId}`);
    userRef.delete();
  }

}
