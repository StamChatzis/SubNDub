import { Injectable } from '@angular/core';
import { Message} from 'src/app/models/firestore-schema/message.model';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { DetailsViewServiceService, SubtitleFormat } from './details-view-service.service';
import { Observable, take } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  constructor(private firestore: AngularFirestore, private detailsService: DetailsViewServiceService) { }

  getUserMessages(userid: string): AngularFirestoreCollection {
    return this.firestore.collection('users').doc(userid).collection('messages');
  }

  getMessagesCount(userId: string): Observable<number> {
    return new Observable((observer) => {
      const notificationsRef = this.firestore.collection('users').doc(userId).collection('messages', ref => ref.where('status', '==', 'unread'));
      const unsubscribe = notificationsRef.valueChanges().subscribe((notifications) => {
        let count = 0;
        notifications.forEach((notification) => {
          count++;
        });
        observer.next(count);
      });
      return unsubscribe;
    });
  }

  
  async updateSub(message: Message): Promise<void>{
    let ownerId = "";
    let updatedRights = [];
    let newOwnerId = "";
    let currentDoc: any;
    var subName: string;
    const sharedVideosRef = this.firestore.collection("sharedVideos", ref=> ref.where('videoId', '==', message.videoId)
       .where('iso', '==', message.iso).where('language', '==', message.language).where('fileName', '==', message.subtitle_name).where('format', '==', message.format).where("id", "==", message.subtitleId));
       this.detailsService.getUserIdByEmail(message.sender).subscribe((id) => {
         ownerId = id;
         console.log("owner: "+ ownerId);
         this.firestore.collection('users').doc(ownerId).collection('videos').doc(message.videoId)
        .collection('subtitleLanguages').doc(message.iso).collection('subtitles', ref=> ref.where('fileName', '==', message.subtitle_name).where("subtitleSharedId","==",message.subtitleId)).get()
        .toPromise()
        .then(async querySnapshot => {
           currentDoc = querySnapshot.docs[0];
           let currentRights = querySnapshot.docs[0].data()['usersRights'];
          currentRights = currentRights.filter(right => right['userEmail']!== message.recipient);
          updatedRights = currentRights.map(right => {
            if (right.userEmail === message.sender) {
              return {...right, right: "Editor" };
            }
            return right;
          });
                 
          querySnapshot.docs[0].ref.delete()
         .then(() => {
            const language = {
              name: message.language,
              language: message.iso,
            }
            this.detailsService.getUserIdByEmail(message.recipient).pipe(take(1)).toPromise().then((newId) => {
              newOwnerId = newId;
              const videoRef = this.firestore.collection('users').doc(newOwnerId).collection('videos').doc(message.videoId);
              videoRef.get().toPromise().then(async videoDoc => {
                if (!videoDoc.exists) {
                  // Create the video document if it doesn't exist
                  await videoRef.set({ videoId: message.videoId });
                }
                const uniqueSubName = await this.getUniqueSubtitleName(message.subtitle_name, newOwnerId, message.videoId, message.iso);
                await this.detailsService.addSubtitle(message.videoId, language, newOwnerId, message.subtitle_name, message.format as SubtitleFormat, message.recipient, uniqueSubName);
                const newOwnerRef = this.firestore.collection('users').doc(newOwnerId).collection('videos').doc(message.videoId)
                .collection('subtitleLanguages').doc(message.iso).collection('subtitles').doc(uniqueSubName);
                await newOwnerRef.get().toPromise();
                
                const queryNewOwnerSnapshot = await newOwnerRef.get().toPromise();
                if (queryNewOwnerSnapshot.exists) {
                  const currentOwnerDoc = queryNewOwnerSnapshot.data();
                  const currentOwnerRight = currentOwnerDoc['usersRights'];
                  updatedRights = [...currentRights,...currentOwnerRight].filter((item, index, self) => self.findIndex(t => t.userEmail === item.userEmail) === index);
                  updatedRights = updatedRights.map(right => {
                    if (right.userEmail === message.sender) {
                      return {...right, right: "Editor" };
                    }
                    return right;
                  });
                  await newOwnerRef.update({ usersRights: updatedRights, subtitleSharedId: message.subtitleId });
                  await sharedVideosRef.get().toPromise().then(querySharedSnapshot => {
                    if (querySharedSnapshot.docs.length > 0) {
                      const sharedVideoDoc = querySharedSnapshot.docs[0];
                      sharedVideoDoc.ref.update({ usersRights: updatedRights });
                    } else {
                      console.log("No shared video document found");
                    }
                  });
                } else {
                  console.log("No document found");
                }
              });
            });
            }).then(() => {
              console.log("Subtitle has been created for new owner");
            }).catch((error) => { 
              console.error(error);
            }); 
          })
        .catch(error => {
            console.error('Error: Subtitle does not exist. ', error);
          });
    });
  }

  async getUniqueSubtitleName(subName: string, newOwnerId: string, videoId: string, iso: string): Promise<string> {
    let counter = 1;
    let foundAvailableName = false;
    let uniqueSubName = subName;
  
    while (!foundAvailableName) {
      const subRef = this.firestore.collection('users').doc(newOwnerId).collection('videos').doc(videoId)
       .collection('subtitleLanguages').doc(iso).collection('subtitles').doc(uniqueSubName);
  
      const sub = await subRef.get().toPromise();
      if (!sub.exists) {
        foundAvailableName = true;
      } else {
        counter++;
        uniqueSubName = subName + counter;
      }
    }
  
    return uniqueSubName;
  }

  async resetRequestOwnerEmail(message: Message): Promise<void> {
    const messageRef: AngularFirestoreCollection = this.firestore.collection('sharedVideos', ref=> ref.where('iso', '==', message.iso).where('language', '==', message.language)
      .where('videoId', '==', message.videoId).where('fileName', '==', message.subtitle_name).where("id","==", message.subtitleId));
    try {
      const snapshot = await messageRef.get().toPromise();
      if(snapshot.size>0){
        await snapshot.docs[0].ref.update({requestOwnerEmail: ""});
      }
    } catch (error) {
      console.error("Error resetting request owner email:", error);
      throw error;
    }
  }

  async deleteMessageFromUserMessages(message: Message, userid: string): Promise<void> {
    if (!message.subtitle_name || !message.iso || !message.language || !message.videoId || !message.status) {
      console.error("Message properties are undefined");
      return;
    }

    if (message.subject.startsWith('Offer')) message.subtitleId = '';
    
    const offerMessageRef: AngularFirestoreCollection = this.firestore.collection('users').doc(userid).collection('messages', ref => ref.where('subtitle_name', '==', message.subtitle_name)
    .where('iso', '==', message.iso).where('language', '==', message.language).where('videoId', '==', message.videoId).where('status', '==', "unread"));

    const messageRef: AngularFirestoreCollection = this.firestore.collection('users').doc(userid).collection('messages', ref => ref.where('subtitle_name', '==', message.subtitle_name)
      .where('iso', '==', message.iso).where('language', '==', message.language).where('videoId', '==', message.videoId).where("subtitleId","==", message.subtitleId).where('status', '==', "unread"));
    
      try {
        let mesRef;
        if (message.subject.startsWith('Offer')){
          mesRef = offerMessageRef;
        } else mesRef = messageRef;
        const snapshot = await mesRef.get().toPromise();
      if (snapshot.size > 0) {
        await snapshot.docs[0].ref.delete();
      }
    } catch (error) {
      console.error("Error deleting message from user messages:", error);
      throw error;
    }
  }


}
