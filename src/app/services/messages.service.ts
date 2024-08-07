import { Injectable } from '@angular/core';
import { Message} from 'src/app/models/firestore-schema/message.model';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { DetailsViewServiceService, SubtitleFormat } from './details-view-service.service';
import { Observable, take } from 'rxjs';
import { NotifierService } from './notifier.service';
import { CommunityHelpService } from './community-help.service';


@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  constructor(private firestore: AngularFirestore,private communityService: CommunityHelpService, private notifier: NotifierService, private detailsService: DetailsViewServiceService) { }

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
    .where('iso', '==', message.iso).where('language', '==', message.language).where('videoId', '==', message.videoId).where('status', '==', "unread").where("id","==",message.id));

    const messageRef: AngularFirestoreCollection = this.firestore.collection('users').doc(userid).collection('messages', ref => ref.where('subtitle_name', '==', message.subtitle_name)
      .where('iso', '==', message.iso).where('language', '==', message.language).where('videoId', '==', message.videoId).where("subtitleId","==", message.subtitleId)
      .where('status', '==', "unread").where("id","==",message.id));
    
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

  async checkRequestStatus(message: Message, userId: string): Promise<string> {
    let subtitleId;
    if (message.subtitleId == undefined)
        subtitleId = "";
    else subtitleId = message.subtitleId;  
    
    if (subtitleId != ""){
      const querySnapshot= await this.firestore.collection('helpRequests', ref => {
        return ref.where('videoId', '==', message.videoId)
          .where('filename', '==', message.subtitle_name)
          .where('language', '==', message.language)
          .where('requestedByID', '==', userId)
          .where('subtitleId', "==", subtitleId);
      }).get().toPromise();
    
      let status;
      querySnapshot.forEach((doc) => {
        status = doc.get('status');
      });
      return status;
    }else {
      const querySnapshot= await this.firestore.collection('helpRequests', ref => {
        return ref.where('videoId', '==', message.videoId)
          .where('filename', '==', message.subtitle_name)
          .where('language', '==', message.language)
          .where('requestedByID', '==', userId);
      }).get().toPromise();
    
      let status;
      querySnapshot.forEach((doc) => {
        status = doc.get('status');
      });

      return status;
    }
        
  }

  async closeRequestStatus(message: Message, userId: string){
    this.firestore.collection('helpRequests', ref => {
      return ref.where('videoId', '==', message.videoId)
            .where('filename', '==', message.subtitle_name) 
            .where('language', '==', message.language)
            .where('requestedByID', '==', userId); 
    })
  .get()
  .subscribe((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        if (!querySnapshot.empty) {
            
            const statusRef = querySnapshot.docs[0].ref;
            statusRef.update({
              status: 'closed'
            })
          }
      })
    });
  }

  async checkIfUserRightExists(message: Message, userId: string): Promise<{ exists: boolean; currentRights: string[]; }> {
    const subtitleRef = this.firestore.collection('users').doc(userId).collection('videos').doc(message.videoId)
      .collection('subtitleLanguages').doc(message.iso).collection('subtitles').doc(message.subtitle_name);
  
    return subtitleRef.get().toPromise().then((docSnapshot) => {
      const currentRights = docSnapshot.exists ? docSnapshot.data().usersRights || [] : [];
      const existingRightIndex = currentRights.findIndex((right) => right.userEmail === message.sender);
  
      if (existingRightIndex !== -1) {
        currentRights[existingRightIndex].right = "Editor";
        return {
          exists: true,
          currentRights: currentRights
        };
  
      } else {
        return {
          exists: false,
          currentRights: currentRights
        };
      }
    });
  }

  async setSubtitleIdToRequest(message: Message, userId: string){
    let subId = "";

    if(message.subtitleId == undefined || message.subtitleId == ""){
      const subtitleRef = this.firestore.collection('users').doc(userId).collection('videos').doc(message.videoId)
       .collection('subtitleLanguages').doc(message.iso).collection('subtitles').doc(message.subtitle_name);
        
      const docSnapshot = await subtitleRef.get().toPromise();
      subId = docSnapshot.exists? docSnapshot.data().subtitleSharedId || "" : "";
  
      const querySnapshot = await this.firestore.collection('helpRequests', ref => {
        return ref.where('videoId', '==', message.videoId)
         .where('filename', '==', message.subtitle_name) 
         .where('language', '==', message.language)
         .where('requestedByID', '==', userId)
         .where('status',"==", "open"); 
      })
     .get()
     .toPromise();
  
      querySnapshot.forEach((doc) => {
        doc.ref.update({ subtitleId: subId });
      });
    }
  }

  async sendInfoMessage(message: Message, userId: string){
    let userName;
      let emailBody;
      this.communityService.getUserNameFromEmail(message.recipient).subscribe((email) => {
          userName =email;

          if (message.subject.startsWith('Offer')){
              emailBody=userName+" accepted your bid.\nYou are now an Editor on this subtitle.";
          }else 
            emailBody=userName+" accepted ownership for this subtitle.";

        this.firestore.collection('users', ref => {
          return ref.where('email', '==', message.sender);
        })
      .get()
      .subscribe((querySnapshot) => {
          querySnapshot.forEach(() => {
            const data = { 
              sender: message.recipient,
              recipient: message.sender,
              subject: "Subtitle: "+message.subtitle_name+"."+message.format,
              createdAt: Date.now(),
              status: "unread",
              subtitle_name: message.subtitle_name,
              body:emailBody,
              videoId: message.videoId,
              iso: message.iso,
              language: message.language,
              format: message.format,
              videoTitle: message.videoTitle,
              subtitleId: message.subtitleId
            }
    
            let senderId;
            this.detailsService.getUserIdByEmail(message.sender).subscribe((id) => {
              senderId=id
            
              const messageRef: AngularFirestoreCollection = this.firestore.collection('users').doc(senderId).collection('messages');
        
              messageRef.add(data).then((docRef) => {
                docRef.update({ id: docRef.id });
              
              });
            });
        });
      });
    });
  }
    
async sendInfoMessageToList(message: Message, userId: string){
          this.firestore.collection('helpRequests', ref => {
              return ref.where('videoId', '==', message.videoId)
                    .where('filename', '==', message.subtitle_name) 
                    .where('language', '==', message.language)
                    .where("iso","==",message.iso)
                    .where('requestedByID', '==', userId)
                    .where('status',"==", "closed"); 
            })
          .get().subscribe((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              const offerList = doc.get('offerList');
              offerList.forEach((offer) => {
                const userEmail = offer.userEmail;
                if(userEmail != message.sender){
                  const dataList = { 
                    sender: message.recipient,
                    recipient: userEmail,
                    subject: "Subtitle: "+message.subtitle_name+"."+message.format,
                    createdAt: Date.now(),
                    status: "unread",
                    subtitle_name: message.subtitle_name,
                    body:"Bid request for this subtitle has been closed.\nThank you for your participation!",
                    videoId: message.videoId,
                    iso: message.iso,
                    language: message.language,
                    format: message.format,
                    videoTitle: message.videoTitle,
                    subtitleId: message.subtitleId
                  }
                  
                  let userEmailId;
                  this.detailsService.getUserIdByEmail(userEmail).subscribe((id) => {
                    userEmailId=id
                    const messageRefList: AngularFirestoreCollection = this.firestore.collection('users').doc(userEmailId).collection('messages');
      
                    messageRefList.add(dataList).then((docRef) => {
                      docRef.update({ id: docRef.id }).catch((err) => this.notifier.showNotification('No info message has been sent', 'DISMISS'));
                    });
                  });

                  
                }
                  
              })
          })
        }); 
    
  }


  async deleteInfoMessageFromUserMessages(message: Message, userid: string): Promise<void> {
    if (!message.subtitle_name || !message.iso || !message.language || !message.videoId || !message.status) {
      console.error("Message properties are undefined");
      return;
    }
    
    const infoMessageRef: AngularFirestoreCollection = this.firestore.collection('users').doc(userid).collection('messages', ref => ref.where('subtitle_name', '==', message.subtitle_name)
    .where('iso', '==', message.iso).where('language', '==', message.language).where('videoId', '==', message.videoId).where('status', '==', "unread").where("id","==",message.id));
      try {
        const snapshot = await infoMessageRef.get().toPromise();
        if (snapshot.size > 0) {
          await snapshot.docs[0].ref.delete();
        }
    } catch (error) {
      console.error("Error deleting message from user messages:", error);
      throw error;
    }
  }


}
