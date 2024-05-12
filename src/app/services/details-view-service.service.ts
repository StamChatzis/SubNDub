import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Language } from '../models/google/google-supported-languages';
import { Observable, combineLatest, map, of, switchMap, take } from 'rxjs';
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

  addSubtitle(videoId: string, language: Language, userUid: string, name: string, format: SubtitleFormat, userEmail: string): void {
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
        iso: language.language,
        usersRights: [{userUid: userUid, right:"Owner", userEmail: userEmail}]
      }

      subtitleRef.set(data);
    })
  }

  addSharedSubtitle(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, userEmail: string, usersrights: string[]): void {
    const userDocRef = this.firestore.collection(`users`).doc(userUid);
    const sharedVideosColRef = userDocRef.collection(`/sharedVideos`);
    const videoDocRef = sharedVideosColRef.doc(videoId);
  
    // Create the video document if it doesn't exist
    videoDocRef.set({videoId}).then(() => {
      const subtitleLanguagesColRef = videoDocRef.collection(`/subtitleLanguages`);
      const subtitleLangDocRef = subtitleLanguagesColRef.doc(ISOcode);
  
      const docData = {
        humanReadable: language,
        ISOcode: ISOcode,
      };
  
      subtitleLangDocRef.set(docData).then(() => {
        const subtitlesColRef = subtitleLangDocRef.collection(`/subtitles`);
        const subtitleDocRef = subtitlesColRef.doc(name);
  
        const data = {
          lastUpdated: Date.now(),
          fileName: name,
          fullFileName: `${name}.${format}`,
          format: format,
          language: language,
          iso: ISOcode,
          usersRights: usersrights,
        };
  
        subtitleDocRef.set(data);
      }).catch((error) => {
        console.error(`Error adding shared subtitle: ${error}`);
      });
    }).catch((error) => {
      console.error(`Error creating video document: ${error}`);
    });
  
  }

  addUsersRight(videoId: string, language: string, ISOcode: string, format: string, userUid: string, useridEmail: string, name: string, right: string, email:string): void {
    const docData = {
      right: right,
      userUid: useridEmail,
      userEmail: email
    }
  
    const subtitleRef = this.firestore.collection('users').doc(userUid).collection('videos').doc(videoId)
    .collection('subtitleLanguages').doc(ISOcode).collection('subtitles').doc(name);
  
    subtitleRef.get().toPromise().then((docSnapshot) => {
      const currentRights = docSnapshot.exists ? docSnapshot.data().usersRights || [] : []; // Get the current array or initialize an empty array
      const existingRight = currentRights.find((right) => right.userUid === docData.userUid);
  
      if (!existingRight) {
        currentRights.push(docData); // Add the new user right to the array
        if(docSnapshot.exists) {        
          const addSharedSubtitlePromises = [];
          if(docSnapshot.data().usersRights.length == 1)
            addSharedSubtitlePromises.push(this.addSharedSubtitle(videoId, ISOcode, language, userUid, name, format, email, currentRights));
          addSharedSubtitlePromises.push(this.addSharedSubtitle(videoId, ISOcode, language, useridEmail, name, format, email, currentRights)); 
  
          Promise.all(addSharedSubtitlePromises).then(() => {
            subtitleRef.update({ usersRights: currentRights }).then(() => {
              setTimeout(() => {
                this.updateSharedVideosForExistingUsers(videoId, ISOcode, language, name, currentRights);
              }, 3000);         
            }); // Update the document with the modified array and update shared videos for existing users
  
            this.notifier.showNotification("Right has been added","OK");
          });
        } 
      } else {
        this.notifier.showNotification("User already exist with a right.","DIMISS");
      }
    });
  }

  getUserIdByEmail(email: string ):Observable<string>{
    return this.firestore.collection('users', ref => ref.where('email', '==', email))
      .valueChanges({ idField: 'uid' })
      .pipe(
        map(users => {
          if (users && users.length > 0) {
            return users[0]['uid']; 
          } else {
            return null;
          }
        })
      );
  }

  checkUserRightsOnSubtitle(videoId: string, language: string, format:string, userUid:string, useridEmail:string, name:string, ISOcode:string, right:string, email:string): void {
  
    this.addUsersRight(videoId, language, ISOcode, format, userUid, useridEmail, name, right, email);
    
  }

  shareSubtitle(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, email: string, right: string): void{

    let useridEmail ="";
    //Retrive userId from the given email address (should exist on the users collection) 

    this.getUserIdByEmail(email).pipe(take(1)).subscribe(userId => {
      if (userId === null) {
        this.notifier.showNotification("User does not exist in the collection. Try other email.","DIMISS");
      } else {
        useridEmail = userId;
        this.checkUserRightsOnSubtitle(videoId, language, format, userUid, useridEmail, name, ISOcode, right, email);
      }
    });
  
  }   

  updateSharedVideosForExistingUsers(videoId: string, ISOcode: string, language: string, name: string, usersRights: string[]): Promise<void[]> {
    const promises = usersRights.map((userRight) => {
      const userRef = this.firestore.collection('users').doc(userRight['userUid']);
      return userRef.collection('sharedVideos').doc(videoId).collection('subtitleLanguages')
      .doc(ISOcode).collection('subtitles').doc(name).update({ usersRights: usersRights });
    });
    return Promise.all(promises);
  }

  updateSharedSubtitleRights(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, usersrights: string[]): void {
      
    this.updateSharedVideosForExistingUsers(videoId,ISOcode,language,name,usersrights);
    const subRef = this.firestore.collection('users').doc(userUid).collection('videos').doc(videoId).collection('subtitleLanguages')
    .doc(ISOcode).collection('subtitles').doc(name).update({usersRights: usersrights});
    this.notifier.showNotification("Changes saved", "OK");
  }
     
}

export enum SubtitleFormat{
  SBV = '.sbv',
  SRT = '.srt'
}