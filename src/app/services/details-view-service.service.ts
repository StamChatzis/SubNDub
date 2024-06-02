import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Language } from '../models/google/google-supported-languages';
import { Observable, combineLatest, map, of, switchMap, take } from 'rxjs';
import { GmailUser } from '../models/firestore-schema/user.model';
import { NotifierService } from './notifier.service';
import {EmailService} from './email.service';

@Injectable()

export class DetailsViewServiceService {

  subtitleLanguages$: Observable<Language[]>;

  constructor(private firestore: AngularFirestore, private notifier: NotifierService, private emailService: EmailService) {}


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

  shareSubtitle(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, email: string, right: string): void{
    
    this.addUserRightOnSub(videoId, ISOcode, language, userUid, name, format, email, right);
  
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

  updateSharedVideosUserRights(videoId: string, ISOcode: string, language: string, name: string, usersRights: string[]): Promise<void> {
    
    const ownersId = usersRights.filter(user => user['right'] == "Owner")[0];

    const subtitleRef = this.firestore.collection('users').doc(ownersId['userUid']).collection('videos').doc(videoId)
    .collection('subtitleLanguages').doc(ISOcode).collection('subtitles').doc(name);

    
    const promises = this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
    .where('fileName', '==', name))
    .get().toPromise()
    .then(async (querySnapshot) => {
      if (!querySnapshot.empty) {
        subtitleRef.get().toPromise().then(subtitleDoc => {
          if (subtitleDoc.exists && JSON.stringify(subtitleDoc.data()?.usersRights) != JSON.stringify(usersRights)) {
            // usersRights arrays are not equal, proceed with the update
            subtitleRef.update({usersRights: usersRights}); //update Owners subtitle rights
            const sharedVideoRef = querySnapshot.docs[0].ref;
            sharedVideoRef.update({
              usersRights: usersRights
            }).then(() => {
              this.notifier.showNotification("User rights have been updated.","OK");
            }).catch((error) => {
              this.notifier.showNotification("Error updating user rights: " + error.message,"DIMISS");
            });
          }
          });
      } else {
        this.notifier.showNotification("Document does not exist.","DIMISS");
      }       
    
    });
    
    return promises;
  }

  updateSharedSubtitleRights(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, usersrights: string[]): void {
      
    const removeUserRights = usersrights.some(user => user['right'] === "Remove right");
    if (removeUserRights){
      this.removeUserRightFromSub(videoId,ISOcode,language,name, usersrights);
    }else {
      this.updateSharedVideosUserRights(videoId, ISOcode, language, name, usersrights);
    }
  }

  
  resetUserRightByEmail(email: string, filename: string, videoId: string, ISOcode:string, language:string): Promise<string> {

    const promises = this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
    .where('fileName', '==', filename))
    .get().toPromise()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        const sharedVideoRef = querySnapshot.docs[0].data();  
        const rights = sharedVideoRef['usersRights'];
        const rightsFilter = rights.filter((obj) => obj.userEmail == email);
        const result = rightsFilter.map((obj) => obj.right);
        return result;
      } else {
        this.notifier.showNotification("Document does not exist.","DIMISS");
      }       
    
    });

    return promises;
  }

  transferOwnership(from_email: string, to_email: string, filename: string, videoId:string, ISOcode:string, language:string, format: string, videoTitle: string): void {
    //this.emailService.sendEmail(from_email, to_email);

    const sharedRef = this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
    .where('fileName', '==', filename));  
    
    let requestOwnerEmail='';

    const NewRequestOnwerEmail = to_email;

    sharedRef.get()
          .subscribe((querySnapshot) => {
            if (!querySnapshot.empty) {
              requestOwnerEmail = querySnapshot.docs[0].data()['requestOwnerEmail'];
              const sharedVideoRef = querySnapshot.docs[0].ref;
              sharedVideoRef.update({
                requestOwnerEmail: NewRequestOnwerEmail
              })
            }});

    const data = { 
      sender: from_email,
      recipient: to_email,
      subject: "Invitation to accept ownership for subtitle: "+filename+"."+format,
      createdAt: Date.now(),
      status: "unread",
      subtitle_name: filename ,
      body:from_email+" invited you to own a subtitle.\nPlease click the button below to accept or decline the transfer ownership invitation",
      videoId: videoId,
      iso: ISOcode,
      language: language,
      format: format,
      videoTitle: videoTitle
    }

    //Add message to user's messages
    this.getUserIdByEmail(to_email).subscribe((userid) => { 
      if (userid != ("" || null || undefined)){
        const messageRef: AngularFirestoreCollection = this.firestore.collection('users').doc(userid).collection('messages');


        messageRef.add(data).then((docRef) => {
          docRef.update({ id: docRef.id });
          this.notifier.showNotification("Invitation has been sent", "OK")
        })
        .catch((err) => this.notifier.showNotification("There was an error trying to send the invitation " + err, "DISMISS"));

      }
        //Delete message from previous requestOwnerEmail if exists
        if (requestOwnerEmail != ""){
          this.getUserIdByEmail(requestOwnerEmail).subscribe((id) => {
            this.removeMessageFromUser(id, videoId, ISOcode, language, filename);
        })
        }
      
        
    });  
}
  


addUserRightOnSub(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, email: string, right: string): void {
  const sharedVideoRef: AngularFirestoreCollection = this.firestore.collection('sharedVideos');

  const data = {
    lastUpdated: Date.now(),
    fileName: name,
    fullFilename: `${name}.${format}`,
    format: format,
    language: language,
    iso: ISOcode,
    videoId: videoId,
    usersRights:[],
    requestOwnerEmail: ""
  };

  const subtitleRef = this.firestore.collection('users').doc(userUid).collection('videos').doc(videoId)
  .collection('subtitleLanguages').doc(ISOcode).collection('subtitles').doc(name);

  subtitleRef.get().toPromise().then((docSnapshot) => {
    const currentRights = docSnapshot.exists ? docSnapshot.data().usersRights || [] : []; 
    const existingRight = currentRights.find((right) => right.email === email);

    if (!existingRight) {
      currentRights.push({
        right: right,
        userEmail: email
      }); 
      if(docSnapshot.exists) {
        subtitleRef.update({usersRights: currentRights});
        data.usersRights = currentRights;  
        this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
          .where('fileName', '==', name))
          .get()
          .subscribe((querySnapshot) => {
            if (!querySnapshot.empty) {
              const sharedVideoRef = querySnapshot.docs[0].ref;
              sharedVideoRef.update({
                usersRights: currentRights
              }).then(() => {
                this.notifier.showNotification("User rights have been added.","OK");
              }).catch((error) => {
                this.notifier.showNotification("Error updating user rights: " + error.message,"DIMISS");
              });
            } else {
              sharedVideoRef.add(data);
              this.notifier.showNotification("User rights have been added.","OK");
            }
          });  
    } 
    } else {
      this.notifier.showNotification("User already exist with a right.","DIMISS");
    }
  });
 
}

removeUserRightFromSub(videoId: string, ISOcode: string, language: string, name: string, usersrights: string[]): void {

  const ownersId = usersrights.filter(user => user['right'] == "Owner")[0];

  const subtitleRef = this.firestore.collection('users').doc(ownersId['userUid']).collection('videos').doc(videoId)
  .collection('subtitleLanguages').doc(ISOcode).collection('subtitles').doc(name);

  const updatedRights = usersrights.filter(user => user['right'] !== "Remove right");
  const usersToRemove = usersrights.filter(user => user['right'] === "Remove right");
  const emailsToRemove = usersToRemove.map(user => user['userEmail']);

  this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
  .where('fileName', '==', name))
  .get().toPromise()
  .then((querySnapshot) => {
    if (!querySnapshot.empty) {
      subtitleRef.get().toPromise().then(() => {
        subtitleRef.update({usersRights: updatedRights}); //update Owners subtitle rights
      });
      const sharedVideoRef = querySnapshot.docs[0].ref;
      const emailToCheck = querySnapshot.docs[0].data()['requestOwnerEmail'];
      if (emailsToRemove.includes(emailToCheck)){
        console.log()
        sharedVideoRef.update({
          requestOwnerEmail: ""
        });

        this.getUserIdByEmail(emailToCheck).subscribe((id) => {
          this.removeMessageFromUser(id, videoId, ISOcode, language, name);
        })
        

      }
      sharedVideoRef.update({
        usersRights: updatedRights
      }).then(() => {
        this.notifier.showNotification("User rights have been removed.","OK");
      }).catch((error) => {
        this.notifier.showNotification("Error updating user rights: " + error.message,"DIMISS");
      });
    
    } else {
      this.notifier.showNotification("Document does not exist.","DIMISS");
    }       
  
  });
          
}

  async getUsersRightsFromSub(userUid: string, videoId: string, ISOcode: string, name: string): Promise<string[]> {
    const subtitleRef = this.firestore.collection('users').doc(userUid).collection('videos').doc(videoId)
      .collection('subtitleLanguages').doc(ISOcode).collection('subtitles').doc(name);
  
    try {
      const docSnapshot = await subtitleRef.get().toPromise();
      const currentRights = docSnapshot.exists ? docSnapshot.data().usersRights || [] : [];
      return currentRights;
    } catch (error) {
      console.error('Error getting subtitle document:', error);
      return [];
    }
  }

  removeMessageFromUser(userid: string, videoId:string, ISOcode:string, language:string, name:string){
    const messageRef = this.firestore.collection('users').doc(userid).collection('messages', ref=> ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
            .where('subtitle_name', '==', name));
            
            messageRef.get().toPromise().then(querySnapshot => {
              querySnapshot.forEach(doc => {
                doc.ref.delete();
              });
            });
  }
     
}

export enum SubtitleFormat{
  SBV = '.sbv',
  SRT = '.srt'
}