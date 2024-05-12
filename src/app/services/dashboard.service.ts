import { Injectable, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, map, of, switchMap, take } from 'rxjs';
import { GmailUser, Video } from '../models/firestore-schema/user.model';
import { AuthService } from './auth.service';
import { YoutubeVideoDetails } from '../models/youtube/youtube-response.model';

@Injectable()
export class DashboardService {
  userVideos$: Observable<Video[]>;
  sharedVideos$: Observable<Video[]>;
  communityVideos$: Observable<Video[]>;

  get getUserVideos(): Observable<Video[]> {
    return this.userVideos$;
  }

  get getUserSharedVideos(): Observable<Video[]> {
    return this.sharedVideos$;
  }

  get communityVideos(): Observable<Video[]> {
    return this.communityVideos$;
  }

  constructor(private firestore: AngularFirestore, private auth: AuthService) {}

  getVideos(userId): Observable<Video[]> {
    return this.userVideos$ = this.firestore.collection<Video>(`users/${userId}/videos/`).valueChanges();
  }

  getSharedVideos(userId): Observable<Video[]> {
    return this.userVideos$ = this.firestore.collection<Video>(`users/${userId}/sharedVideos/`).valueChanges();
  }

  getCommunityVideos(): Observable<Video[]> {
    return this.firestore.collection<Video>('helpRequests').snapshotChanges().pipe(
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

  addVideo(videoId: string, userUid: string): void {
    const userRef: AngularFirestoreDocument<GmailUser> = this.firestore.doc(`users/${userUid}`);

    userRef.collection('videos').doc(videoId).set({videoId});
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
