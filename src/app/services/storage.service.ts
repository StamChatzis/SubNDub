import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireStorageReference } from '@angular/fire/compat/storage/ref'
import { AuthService } from './auth.service';
import { Observable, map, switchMap, take } from 'rxjs';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { CommunityHelpRequest } from '../models/firestore-schema/help-request.model';
import { GmailUser } from '../models/firestore-schema/user.model';
import { ForeignLanguage } from "../models/general/language-skills";

@Injectable({
  providedIn: 'root'
})

export class StorageService {

    constructor(private http: HttpClient,
        private authService: AuthService,
        private firestore: AngularFirestore,
        private storageRef: AngularFireStorage,
        private snackbar: MatSnackBar) { }

    createFirestorageRef(storage: AngularFireStorage, language: string, subtitle: Blob, videoId: string, filePath: string): void {
      //sets up the Firestorage required references and receives required parameters to complete the upload process
      this.storageRef = storage;
      let pathRef: AngularFireStorageReference;
      this.authService.user.pipe(take(1)).subscribe(user => {
        const pathString = `subtitles/${user.uid}/${videoId}/${language}/${filePath}`;
        pathRef = this.storageRef.ref(pathString);
        this.uploadToFirestorage(pathRef, subtitle, user.uid, videoId , language, filePath);
      })
    }

    saveToFireStorageShared(ownerId:string, storage: AngularFireStorage, language: string, subtitle: Blob, videoId: string, filePath: string){
      this.storageRef = storage;
      let pathRef: AngularFireStorageReference;
      const pathString = `subtitles/${ownerId}/${videoId}/${language}/${filePath}`;
      pathRef = this.storageRef.ref(pathString);
      this.uploadToFirestorage(pathRef, subtitle, ownerId, videoId , language, filePath);
    }

    uploadToFirestorage(pathRef: AngularFireStorageReference, subtitle: Blob, userUid: string, videoId: string, language: string, filePath:string): void {
        pathRef.put(subtitle).then(() => {
            //update firestore record of user with the download url for this uploaded subtitle for future use
            const subRef: AngularFirestoreDocument = this.firestore.doc(`users/${userUid}/videos/${videoId}/subtitleLanguages/${language}/subtitles/${filePath.split('.')[0]}`);
            pathRef.getDownloadURL().pipe(take(1)).subscribe((url: URL) => {
                subRef.update({
                    storageUrl: url,
                    lastUpdated: Date.now()
                });
                this.snackbar.open('Update Complete!','DISMISS', {duration:5000});
            })
        }, (reject) => {
            this.snackbar.open(reject.message);
        });
    }

    createFirestorageRefCommunity(storage: AngularFireStorage, subtitle: Blob, requestId: string, requestDetails: CommunityHelpRequest): void {
        //sets up the Firestorage required references and receives required parameters to complete the upload process
        this.storageRef = storage;
        let pathRef: AngularFireStorageReference;
        this.authService.user.pipe(take(1)).subscribe(user => {
            const pathString = `community-subtitles/${requestId}/${user.uid}/${requestDetails.videoId}`;
            pathRef = this.storageRef.ref(pathString);
            this.uploadToFirestorageCommunitySub(pathRef, subtitle, user, requestId, requestDetails);
        })
    }

    uploadToFirestorageCommunitySub(pathRef: AngularFireStorageReference, subtitle: Blob, user: GmailUser, requestId: string, requestDetails: CommunityHelpRequest): void {
        pathRef.put(subtitle).then(() => {
            //update firestore record of user with a new notification about the subtitle
            const subRef: AngularFirestoreDocument = this.firestore.doc(`users/${requestDetails.requestedByID}/notifications/${requestId}/subtitles/${user.uid}`);
            pathRef.getDownloadURL().pipe(take(1)).subscribe((url: URL) => {
                subRef.set({
                    requestId: requestId,
                    storageUrl: url,
                    created: Date.now(),
                    createdBy: user.displayName
                });
                this.snackbar.open('Update Complete!','DISMISS', {duration:5000});
            })
        }, (reject) => {
            this.snackbar.open(reject.message);
        });
    }

    getSubtitleURL(videoId: string, isoCode: string, subtitleName:string): Observable<string> {
        return this.authService.user.pipe(
            take(1),
            switchMap(user => {
                const subRef: AngularFirestoreDocument = this.firestore.doc(`users/${user.uid}/videos/${videoId}/subtitleLanguages/${isoCode}/subtitles/${subtitleName.split('.')[0]}`);
                return subRef.get();
            }),
            map(doc => {
                return doc.get('storageUrl');
            })
        );
    }

    getSubtitleURLForShared(ownerId:string, videoId: string, isoCode: string, subtitleName:string){
      const subRef: AngularFirestoreDocument = this.firestore.doc(`users/${ownerId}/videos/${videoId}/subtitleLanguages/${isoCode}/subtitles/${subtitleName.split('.')[0]}`);
      return subRef.get()
        .pipe(take(1),
          map(doc => {
        return doc.get('storageUrl');
      }))
    }

    fetchSubtitleFile(url: string): Observable<string> {
       return this.http.get(url, {responseType: 'text'});
    }

    deleteSubtitleFile(subFileUrl: any){
      const pathRef = this.storageRef.ref(subFileUrl);
      try {
        return pathRef.delete();
      }
      catch (error) {
        console.log(error.message)
      }
    }

    getCommunityRequestDetails(requestId: string): Observable<CommunityHelpRequest> {
        return this.firestore.doc<CommunityHelpRequest>(`helpRequests/${requestId}`).get()
        .pipe(
            map(content => {
                return content.data()
            })
        );
    }

  getCountries(uid: any){
    return this.firestore.collection<ForeignLanguage>(`users/${uid}/languages/`).valueChanges();
  }
}
