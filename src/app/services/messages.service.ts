import { Injectable } from '@angular/core';
import { Message} from 'src/app/models/firestore-schema/message.model';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { DetailsViewServiceService, SubtitleFormat } from './details-view-service.service';
import { Observable } from 'rxjs';


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
    const sharedVideosRef = this.firestore.collection("sharedVideos", ref=> ref.where('videoId', '==', message.videoId)
        .where('iso', '==', message.iso).where('language', '==', message.language).where('fileName', '==', message.subtitle_name).where('format', '==', message.format));
       this.detailsService.getUserIdByEmail(message.sender).subscribe((id) => {
         ownerId = id;
         this.firestore.collection('users').doc(ownerId).collection('videos').doc(message.videoId)
         .collection('subtitleLanguages').doc(message.iso).collection('subtitles', ref=> ref.where('fileName', '==', message.subtitle_name)).get()
         .toPromise()
         .then(querySnapshot => {
           currentDoc = querySnapshot.docs[0];
           let currentRights = querySnapshot.docs[0].data()['usersRights'];      
          currentRights = currentRights.filter(right => right['userEmail'] !== message.recipient);
          updatedRights = currentRights.map(right => {
            if (right.userEmail === message.sender) {
              return { ...right, right: "Editor" };
            }
            return right;
          });

          querySnapshot.docs[0].ref.delete()
          .then(() => {
            const language = {
              name: message.language,
              language: message.iso,
            }
            this.detailsService.getUserIdByEmail(message.recipient).subscribe((newId) => {
               newOwnerId = newId;
               const videoRef = this.firestore.collection('users').doc(newOwnerId).collection('videos').doc(message.videoId);
               videoRef.get().toPromise().then(videoDoc => {
                  if (!videoDoc.exists) {
                    // Create the video document if it doesn't exist
                    videoRef.set({videoId: message.videoId}).then(() => {
                      this.detailsService.addSubtitle(message.videoId, language, newOwnerId, message.subtitle_name, message.format as SubtitleFormat, message.recipient);
                    });
                  } else {
                    this.detailsService.addSubtitle(message.videoId, language, newOwnerId, message.subtitle_name, message.format as SubtitleFormat, message.recipient);
                  }
                }).then(() => {
                  setTimeout(() => {
                    const newOwnerRef = this.firestore.collection('users').doc(newOwnerId).collection('videos').doc(message.videoId)
                  .collection('subtitleLanguages').doc(message.iso).collection('subtitles').doc(message.subtitle_name);
                  newOwnerRef.get()
                  .toPromise()
                  .then(queryNewOwnerSnapshot => {             
                    if(queryNewOwnerSnapshot.exists){
                      const currentOwnerDoc = queryNewOwnerSnapshot.data()
                      const currentOwnerRight = currentOwnerDoc['usersRights'];
                      
                      updatedRights = [...currentRights, ...currentOwnerRight].filter((item, index, self) => self.findIndex(t => t.userEmail === item.userEmail) === index);
                      updatedRights = updatedRights.map(right => {
                        if (right.userEmail === message.sender) {
                          return { ...right, right: "Editor" };
                        }
                        return right;
                      });                  
                      newOwnerRef.update({ usersRights: updatedRights })
                      .then(() => {
                        sharedVideosRef.get().subscribe(querySharedSnapshot => {
                          if (querySharedSnapshot.docs.length > 0) {
                            const sharedVideoDoc = querySharedSnapshot.docs[0];
                            sharedVideoDoc.ref.update({ usersRights: updatedRights })                         
                          } else {
                            console.log("No shared video document found");
                          }
                        });
                      })
                    }else{
                      console.log("No document found");
                    }
                  }).catch((err) => console.error("No document ref found ", err));
                  }, 1000);
                });
              })
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

  async resetRequestOwnerEmail(message: Message): Promise<void> {
    const messageRef: AngularFirestoreCollection = this.firestore.collection('sharedVideos', ref=> ref.where('iso', '==', message.iso).where('language', '==', message.language)
      .where('videoId', '==', message.videoId).where('fileName', '==', message.subtitle_name));
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
  
    const messageRef: AngularFirestoreCollection = this.firestore.collection('users').doc(userid).collection('messages', ref => ref.where('subtitle_name', '==', message.subtitle_name)
      .where('iso', '==', message.iso).where('language', '==', message.language).where('videoId', '==', message.videoId).where('status', '==', "unread"));
    try {
      const snapshot = await messageRef.get().toPromise();
      if (snapshot.size > 0) {
        await snapshot.docs[0].ref.delete();
      }
    } catch (error) {
      console.error("Error deleting message from user messages:", error);
      throw error;
    }
  }


}
