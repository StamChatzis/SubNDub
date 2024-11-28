import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Language } from '../models/google/google-supported-languages';
import { Observable, combineLatest, map, of, switchMap, take } from 'rxjs';
import { GmailUser } from '../models/firestore-schema/user.model';
import { NotifierService } from './notifier.service';
import { MatSnackBar } from "@angular/material/snack-bar";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { AngularFireStorageReference } from "@angular/fire/compat/storage/ref";
import { CommunityHelpService } from './community-help.service';
import { SubtitleResponse } from "../models/firestore-schema/subtitles.model";
import { EmailService } from './email.service';

@Injectable({
  providedIn: 'root'
})

export class DetailsViewServiceService {

  constructor(private firestore: AngularFirestore,
              private notifier: NotifierService,
              private storage: AngularFireStorage,
              private snackbar: MatSnackBar,
               private communityService: CommunityHelpService,
              private emailService: EmailService) {}

  getSubtitleLanguages(userUid: string, videoId: string): Observable<SubtitleResponse[]> {
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

  requestCommunityHelp(user: GmailUser, videoId: string, language:string, iso: string, filename: string, format: string, deadline: string, subtitleId: string): void {
    const helpRequestRef: AngularFirestoreCollection = this.firestore.collection(`helpRequests`);

    if (subtitleId == undefined)
        subtitleId ="";

    const data = {
      requestedBy: user.displayName,
      requestedByID: user.uid,
      timestamp: Date.now(),
      videoId: videoId,
      language: language,
      status: 'open',
      iso: iso,
      filename: filename,
      format: format,
      deadline: deadline,
      offerList: [],
      subtitleId: subtitleId
    }

    let helpRef;
    if (subtitleId == ""){
      helpRef = this.firestore.collection(`helpRequests`, ref => ref.where('filename', '==', filename).where('language', '==', language).where('format', '==', format)
      .where('requestedByID', '==', user.uid));
    }else {
      helpRef = this.firestore.collection(`helpRequests`, ref => ref.where('filename', '==', filename).where('language', '==', language).where('format', '==', format)
      .where('requestedByID', '==', user.uid).where('subtitleId', "==", subtitleId));
    }
    helpRef
    .get()
    .subscribe((subRequest) => {
      if (!subRequest.empty) {
        helpRef.get().toPromise().then(helpdoc => {
          let status = helpdoc.docs[0].data().status;
          if(status == "closed"){
            const helprequestRef = helpdoc.docs[0].ref;
            helprequestRef.update({
              status: "open",
              deadline: deadline,
              offerList: []
            }).then(() => {this.notifier.showNotification("Subtitle has been successfully requested for a bid.","OK");});

          }
          // Perform actions if filename exists
          else  this.notifier.showNotification("Subtitle has been already requested for a bid.","DIMISS");
        });
        return;
      } else {
        // Perform actions if filename does not exist
        helpRequestRef.add(data);
        this.notifier.showNotification("Subtitle has been successfully requested for a bid.","OK");
      }
    });

  }

  addSubtitle(videoId: string, language: Language, userUid: string, name: string, format: SubtitleFormat, userEmail: string, subName?: string) {
    const docRef: AngularFirestoreDocument = this.firestore.doc(`users/${userUid}/videos/${videoId}/subtitleLanguages/${language.language}`);

    const docData = {
      humanReadable: language.name,
      ISOcode: language.language,
    }

    const docName: string = subName || name;

    docRef.set(docData).then(() => {
      const subtitleRef: AngularFirestoreDocument = docRef.collection(`/subtitles`).doc(docName);

      const data = {
        lastUpdated: Date.now(),
        fileName: name,
        fullFileName: `${name}.${format}`,
        format: format,
        language: language.name,
        iso: language.language,
        usersRights: [{userUid: userUid, right: "Owner", userEmail: userEmail}],
        isUsed: false,
        isUsedBy: "",
        subtitleSharedId: ""
      }

      subtitleRef.set(data);
    })
    this.createEmptyFileToStorage(userUid, videoId, language.language, (name + '.' + format))
  }

  createEmptyFileToStorage(uid: any, videoId: any, isoCode: any, filePath: any){
    const pathString = `subtitles/${uid}/${videoId}/${isoCode}/${filePath}`;
    let pathRef: AngularFireStorageReference;
    pathRef = this.storage.ref(pathString);

    const emptySub = new Blob([''], {type: 'text; charset=utf8'});

    pathRef.put(emptySub).then(() => {
      const subRef: AngularFirestoreDocument = this.firestore.doc(`users/${uid}/videos/${videoId}/subtitleLanguages/${isoCode}/subtitles/${filePath.split('.')[0]}`);
      pathRef.getDownloadURL().pipe(take(1)).subscribe((url: URL) => {
        subRef.update({
          storageUrl: url,
          lastUpdated: Date.now()
        }).then(() => {
          this.snackbar.open('Subtitle Created!','OK', {duration:3000});
        }).catch(err => {
          this.snackbar.open('Problem creating subtitle','DISMISS', {duration:4000});
        });

      })
    },(reject) => {
      this.snackbar.open(reject.message);
    })

  }

  deleteSubtitle(videoId:any, uid:any, ISOcode:any, subName: any){
    const subRef: AngularFirestoreDocument = this.firestore.doc(`users/${uid}/videos/${videoId}/subtitleLanguages/${ISOcode}/subtitles/${subName}`)
    return subRef.delete()
  }

  shareSubtitle(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, email: string, right: string, subtitleId: any, sendNotification: boolean): void{
    this.addUserRightOnSub(videoId, ISOcode, language, userUid, name, format, email, right, subtitleId, sendNotification);
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

  updateSharedVideosUserRights(videoId: string, ISOcode: string, language: string, name: string, usersRights: string[], subtitleId:any): Promise<void> {

    const ownersId = usersRights.filter(user => user['right'] == "Owner")[0];

    const subtitleRef = this.firestore.collection('users').doc(ownersId['userUid']).collection('videos').doc(videoId)
    .collection('subtitleLanguages').doc(ISOcode).collection('subtitles').doc(name);

    const promises = this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
    .where('fileName', '==', name).where("id", "==", subtitleId))
    .get().toPromise()
    .then(async (querySnapshot) => {
      if (!querySnapshot.empty) {
        subtitleRef.get().toPromise().then(subtitleDoc => {
          if (subtitleDoc.exists && JSON.stringify(subtitleDoc.data()?.usersRights) != JSON.stringify(usersRights)) {
            // usersRights arrays are not equal, proceed with the update
            subtitleRef.update({usersRights: usersRights}); //update Owners subtitle rights
            const sharedVideoRef = querySnapshot.docs[0].ref;
            if(subtitleDoc.data().isUsed == undefined)
              subtitleDoc.ref.update({isUsed: false});
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

  updateSharedSubtitleRights(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, usersrights: string[], subtitleId: any): void {

    const removeUserRights = usersrights.some(user => user['right'] === "Remove right");
    if (removeUserRights){
      this.removeUserRightFromSub(videoId,ISOcode,language,name, usersrights, subtitleId);
    }else {
      this.updateSharedVideosUserRights(videoId, ISOcode, language, name, usersrights, subtitleId);
    }
  }


  resetUserRightByEmail(email: string, filename: string, videoId: string, ISOcode:string, language:string, subtitleId:any): Promise<string> {

    const promises = this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
    .where('fileName', '==', filename).where("id", "==", subtitleId))
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

  transferOwnership(from_email: string, to_email: string, filename: string, videoId:string, ISOcode:string, language:string, format: string, videoTitle: string, subtitleId: any): void {
    this.emailService.sendEmail(from_email, to_email);

    let userName;
      this.communityService.getUserNameFromEmail(from_email).subscribe((email) => {
          userName =email;
      const sharedRef = this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
        .where('fileName', '==', filename).where("id", "==", subtitleId));

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
          body:userName+" invited you to own a subtitle.\nPlease click the button below to accept or decline the transfer ownership invitation",
          videoId: videoId,
          iso: ISOcode,
          language: language,
          format: format,
          videoTitle: videoTitle,
          subtitleId: subtitleId
        }

        //Add message to user's messages
        this.getUserIdByEmail(to_email).subscribe((userid) => {
          if (userid != "" || userid != null || userid != undefined){
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
                this.removeMessageFromUser(id, videoId, ISOcode, language, filename, subtitleId);
            })
            }
        });
      });
  }

  async getUsersRightsFromSharedSub(userUid: string, videoId: string, ISOcode: string, name: string, subtitleId: string, language: string): Promise<string[]>{
    const subtitleCollection = this.firestore.collection('sharedVideos');

    const query = subtitleCollection.ref
     .where('videoId', '==', videoId)
     .where('iso', '==', ISOcode)
     .where('language', '==', language)
     .where('fileName', '==', name)
     .where('id', '==', subtitleId);

    const snapshot = await query.get();

    try {
      if (snapshot.docs.length > 0) {
        const currentRights = (snapshot.docs[0].data() as any).usersRights || [];
        return currentRights;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting subtitle document:', error);
      return [];
    }
  }

  addUserRightOnSub(videoId: string, ISOcode: string, language: string, userUid: string, name: string, format: string, email: string, right: string, subtitleId: any, sendNotification: boolean): void {
    const sharedVideoRef: AngularFirestoreCollection = this.firestore.collection('sharedVideos');
    const id = this.firestore.createId();

    const data = {
      id: id,
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
      const existingRight = currentRights.find((right) => right.userEmail === email);
      const substitleSharedId = docSnapshot.data().subtitleSharedId;
      const ownerEmail = currentRights.find((right) => right.right === "Owner");
      const isUsed = docSnapshot.data().isUsed;

      if (!existingRight) {
        currentRights.push({
          right: right,
          userEmail: email
        });
        if(docSnapshot.exists) {
          subtitleRef.update({usersRights: currentRights});
          if (isUsed == undefined || isUsed==null)
            docSnapshot.ref.update({ isUsed: false });
          data.usersRights = currentRights;
          var sharedQuery;

            if(subtitleId == undefined){
              if(substitleSharedId != undefined){
                subtitleId = substitleSharedId;
              } else {
                subtitleId = "";
              }
            }

            sharedQuery = this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
              .where('fileName', '==', name).where("id","==", subtitleId));
          sharedQuery.get()
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
                subtitleRef.update({subtitleSharedId: data.id});
                if (isUsed != undefined)
                  subtitleRef.update({isUsed: isUsed});
                this.notifier.showNotification("User rights have been added.","OK");
              }
            });
            if(sendNotification == true)
              this.emailService.sendShareSubEmail(ownerEmail.userEmail,email, name+"."+format, videoId);
      }
      } else {
        this.notifier.showNotification("User already exist with a right.","DIMISS");
      }
    });
  }

  removeUserRightFromSub(videoId: string, ISOcode: string, language: string, name: string, usersrights: string[], subtitleId: any): void {

    const ownersId = usersrights.filter(user => user['right'] == "Owner")[0];

    const subtitleRef = this.firestore.collection('users').doc(ownersId['userUid']).collection('videos').doc(videoId)
    .collection('subtitleLanguages').doc(ISOcode).collection('subtitles').doc(name);

    const updatedRights = usersrights.filter(user => user['right'] !== "Remove right");
    const usersToRemove = usersrights.filter(user => user['right'] === "Remove right");
    const emailsToRemove = usersToRemove.map(user => user['userEmail']);

    this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
    .where('fileName', '==', name).where("id", "==", subtitleId))
    .get().toPromise()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        subtitleRef.get().toPromise().then(() => {
          subtitleRef.update({usersRights: updatedRights}); //update Owners subtitle rights
        });
        const sharedVideoRef = querySnapshot.docs[0].ref;
        const emailToCheck = querySnapshot.docs[0].data()['requestOwnerEmail'];

        if (emailsToRemove.includes(emailToCheck)){
          sharedVideoRef.update({
            requestOwnerEmail: ""
          });

          this.getUserIdByEmail(emailToCheck).subscribe((id) => {
            this.removeMessageFromUser(id, videoId, ISOcode, language, name, subtitleId);
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

  async getUsersRightsFromSub(userUid: string, videoId: string, ISOcode: string, name: string, subtitleId: string): Promise<string[]> {

    const subtitleCollection = this.firestore.collection('users').doc(userUid).collection('videos').doc(videoId)
    .collection('subtitleLanguages').doc(ISOcode).collection('subtitles');

    let snapshot;

    if (subtitleId) {
      const query = subtitleCollection.ref.where('subtitleSharedId', '==', subtitleId).limit(1);
      snapshot = await query.get();
      if (snapshot.docs.length > 0) {
        snapshot = snapshot.docs[0];
      } else {
        snapshot = null;
      }
    } else {
      const docRef = subtitleCollection.ref.doc(name);
      snapshot = await docRef.get();
    }

    try {
      if (snapshot && snapshot.exists) {
        const currentRights = snapshot.data().usersRights || [];
        return currentRights;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting subtitle document:', error);
      return [];
    }
  }

  removeMessageFromUser(userid: string, videoId:string, ISOcode:string, language:string, name:string, subtitleId: any){
    const messageRef = this.firestore.collection('users').doc(userid).collection('messages', ref=> ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
            .where('subtitle_name', '==', name).where("subtitleId", "==", subtitleId));

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
