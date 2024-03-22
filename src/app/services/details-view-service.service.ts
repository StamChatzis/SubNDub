import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Language } from '../models/google/google-supported-languages';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { GmailUser } from '../models/firestore-schema/user.model';

@Injectable()

export class DetailsViewServiceService {

  subtitleLanguages$: Observable<Language[]>;

  constructor(private firestore: AngularFirestore) {}


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

    helpRequestRef.add(data);

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
}

export enum SubtitleFormat{
  SBV = '.sbv',
  SRT = '.srt'
}
