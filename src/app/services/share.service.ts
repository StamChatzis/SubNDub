import { Injectable } from "@angular/core";
import { SharedVideo } from "../models/firestore-schema/shared-video.model";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable, map } from "rxjs";
import {Language} from "../models/google/google-supported-languages";
import {SharedSubtitleResponse} from "../models/firestore-schema/subtitles.model";

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  sharedVideoDetails: SharedVideo;

  constructor(private firestore: AngularFirestore) { }


  async getRequestOwnerEmail(videoId: string, ISOcode: string, language: string, filename: string, subtitleId:any): Promise<string> {
    const querySnapshot = await this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
    .where('fileName', '==', filename).where("id","==", subtitleId))
    .get().toPromise();

    if (!querySnapshot.empty) {
      const sharedVideoRef = querySnapshot.docs[0].data();
      const request = sharedVideoRef['requestOwnerEmail'];
      return request;
    }

    return null;
  }

  getSharedSubtitleLanguages(email: string, videoId: string) {
    const sharedVideosRef = this.firestore.collection<SharedSubtitleResponse>('sharedVideos', ref =>
      ref.where('videoId', '==', videoId));

    return sharedVideosRef.get().pipe(
      map(snapshot => {
        return snapshot.docs.filter(doc => {
          const usersRights = doc.data()['usersRights'];
          return usersRights.some(userRight => userRight.userEmail === email)&& usersRights.length > 1;
        }).map(doc => doc.data());
      })
    );
  }

  async setIsUsedSubtitle(videoId: string, ISOcode: string, language: string, filename: string, subtitleId:any, isUsedValue: boolean, ownerId:string, isUsedByValue:string){
    var userId;
    if (subtitleId){   
    
      const sharedVideoRef = this.firestore.collection(`sharedVideos`, ref => ref.where('videoId', '==', videoId).where('iso', '==', ISOcode).where('language', '==', language)
      .where('fullFilename', '==', filename).where("id","==", subtitleId))

      
        sharedVideoRef.get().subscribe(snapshot => {
          if (snapshot.empty) {
            console.log('No matching documents.');
            return;
          }

          snapshot.forEach(doc => {
            if(ownerId=="" || ownerId == undefined){
              userId = doc.data()['usersRights'].find(user => user.right === 'Owner').userUid;
            } else userId = ownerId;

            doc.ref.update({ isUsed: isUsedValue, isUsedBy: isUsedByValue })
              .then(() => {
                const subtitleRef = this.firestore.collection('users').doc(userId).collection('videos').doc(videoId)
                .collection('subtitleLanguages').doc(ISOcode).collection('subtitles').doc(filename.split('.')[0]);

                subtitleRef.get().toPromise().then(snapshot => {
                  if (!snapshot.exists) {
                    console.log('No matching users documents.');
                    return;
                  }else     
                    subtitleRef.update({ isUsed: isUsedValue, isUsedBy: isUsedByValue })
                  
                });
                
              })
              .catch(error => {
                console.error('Error updating document: ', error);
              });
          });
        });

        
    }
    
  }

  getSubtitleIsUsed(videoId: string, ISOcode: string, language: string, filename: string, subtitleId: any): Promise<{ isUsed: boolean, isUsedBy: string } | null> {
    return new Promise((resolve, reject) => {
        // Check if subtitleId is valid
        if (subtitleId === "" || subtitleId === null || subtitleId === undefined) {
            resolve(null); 
            return;
        }

        const sharedVideoRef = this.firestore.collection('sharedVideos', ref => 
            ref.where('videoId', '==', videoId)
               .where('iso', '==', ISOcode)
               .where('language', '==', language)
               .where('fullFilename', '==', filename)
               .where('id', '==', subtitleId)
        );

        sharedVideoRef.get().toPromise()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log('No matching documents.');
                    resolve(null); 
                } else {
                    
                    const data = snapshot.docs[0].data();
                    
                    const isUsed = data.hasOwnProperty('isUsed') ? data['isUsed'] : undefined;
                    const isUsedBy = data.hasOwnProperty('isUsedBy') ? data['isUsedBy'] : undefined;

                    if (isUsed === undefined) {
                        resolve(null);
                    } else {
                        const result = {
                            isUsed: isUsed, 
                            isUsedBy: isUsedBy 
                        };
                        resolve(result); 
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching subtitle data:', error);
                reject(error); 
            });
    });
  }
}
