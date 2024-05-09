import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Language } from '../models/google/google-supported-languages';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { GmailUser } from '../models/firestore-schema/user.model';
import { NotifierService } from './notifier.service';

@Injectable()

export class DetailsViewServiceService {

  subtitleLanguages$: Observable<Language[]>;

  constructor(private firestore: AngularFirestore, private notifier: NotifierService) {}


  getSubtitleLanguages(userUid: string, videoId: string): Observable<Language[]> {
    const videoRef = this.firestore.collection('users').doc(userUid).collection('videos').doc(videoId);

    // Get all subtitle languages and then fetch subtitles for each language
    return videoRef.collection('subtitleLanguages').snapshotChanges().pipe(
      switchMap(languages => {
        return languages.length ? combineLatest(
          languages.map(language => 
            videoRef.collection('subtitleLanguages').doc(language.payload.doc.id)
              .collection('subtitles').snapshotChanges().pipe(
                map(subtitles => subtitles.map(sub => sub.payload.doc.data()))
              )
          )
        ) : of([]);
      }),
      map(subtitlesCollections => subtitlesCollections.flat())
    );
  }


  requestCommunityHelp(user: GmailUser, videoId: string, language:string, iso: string, filename: string, format: string): void {
    const helpRequestRef: AngularFirestoreCollection = this.firestore.collection(`helpRequests`);

    const data = {
      requestedBy: user.displayName,
      requestedByID: user.uid,
      timestamp: Date.now(),
      videoId: videoId,
      language: language,
      status: 'open',
      iso: iso,
      filename: filename,
      format: format
    }

    this.firestore.collection(`helpRequests`, ref => ref.where('filename', '==', filename).where('status', '==','open'))
    .get()
    .subscribe(subRequest => {
      if (!subRequest.empty) {
        // Perform actions if filename exists
        this.notifier.showNotification("Subtitle has been already requested for a bid.","DIMISS");
        return;
      } else {
        // Perform actions if filename does not exist
        helpRequestRef.add(data);
        this.notifier.showNotification("Subtitle has been successfully requested for a bid.","OK");
        
      }
    });
  }

  addSubtitle(videoId: string, language: Language, userUid: string, name: string, format: SubtitleFormat): void {
    const docRef: AngularFirestoreDocument = this.firestore.doc(`users/${userUid}/videos/${videoId}/subtitleLanguages/${language.language}`);
    
    const docData = {
      humanReadable: language.name,
      ISOcode: language.language,
    }

    docRef.set(docData).then(()=> {
      const subtitleRef: AngularFirestoreDocument = docRef.collection(`/subtitles`).doc(name);
      
      const data = {
        lastUpdated: Date.now(),
        fileName: name,
        fullFileName: `${name}.${format}`,
        format: format,
        language: language.name,
        iso: language.language
      }

      subtitleRef.set(data);
    })
  }

  shareSubtitle(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, email: string, right: string): void{
    console.log("Email " + email);
    console.log("Right " + right);
  }
     
}

export enum SubtitleFormat{
  SBV = '.sbv',
  SRT = '.srt'
}