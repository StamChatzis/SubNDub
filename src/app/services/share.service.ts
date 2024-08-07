import { Injectable } from "@angular/core";
import { SharedVideo } from "../models/firestore-schema/shared-video.model";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable, map } from "rxjs";
import {Language} from "../models/google/google-supported-languages";
import {SharedSubtitleResponse} from "../models/firestore-schema/subtitles.model";

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  sharedVideoDetails: SharedVideo;

  constructor(private firestore: AngularFirestore) { }


  async getRequestOwnerEmail(videoId: string, ISOcode: string, language: string, filename: string, subtitleId:any): Promise<string> {
    const querySnapshot = await this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
    .where('fileName', '==', filename).where("id","==", subtitleId))
    .get().toPromise();

    if (!querySnapshot.empty) {
      const sharedVideoRef = querySnapshot.docs[0].data();
      const request = sharedVideoRef['requestOwnerEmail'];
      return request;
    }

    return null;
  }

  getSharedSubtitleLanguages(email: string, videoId: string) {
    const sharedVideosRef = this.firestore.collection<SharedSubtitleResponse>('sharedVideos', ref =>
      ref.where('videoId', '==', videoId));

    return sharedVideosRef.get().pipe(
      map(snapshot => {
        return snapshot.docs.filter(doc => {
          const usersRights = doc.data()['usersRights'];
          return usersRights.some(userRight => userRight.userEmail === email)&& usersRights.length > 1;
        }).map(doc => doc.data());
      })
    );
  }
}
