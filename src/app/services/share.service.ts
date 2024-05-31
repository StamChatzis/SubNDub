import { Injectable } from "@angular/core";
import { SharedVideo } from "../models/firestore-schema/shared-video.model";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  sharedVideoDetails: SharedVideo;

  constructor(private firestore: AngularFirestore) { }


    async getRequestOwnerEmail(videoId: string, ISOcode: string, language: string, filename: string): Promise<string> {
      const querySnapshot = await this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
      .where('fileName', '==', filename))
      .get().toPromise();
    
      if (!querySnapshot.empty) {
        const sharedVideoRef = querySnapshot.docs[0].data();  
        const request = sharedVideoRef['requestOwnerEmail'];
        return request;
      }
    
      return null;
    }
}
