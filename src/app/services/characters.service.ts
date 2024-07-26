import {Injectable} from "@angular/core";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {CharacterAssign} from "../models/general/person-assign.model";

@Injectable({
  providedIn: 'root'
})

export class CharactersService {

  constructor(private firestore: AngularFirestore) {}

  getCharactersOfSubtitle(uid: any, videoId: any, langIso: any, subName: any) {
    subName = subName.split(".")[0]
    const charRef = this.firestore.collection<CharacterAssign>(`users/${uid}/videos/${videoId}/subtitleLanguages/${langIso}/subtitles/${subName}/characters`);
    return charRef.valueChanges()
  }

  saveCharacters(uid: any, videoId: any, langIso: any, subName: any, data: CharacterAssign[]) {
    subName = subName.split(".")[0]
    for(let i = 0; i < data.length; i++) {
      let charRef = this.firestore.doc(`users/${uid}/videos/${videoId}/subtitleLanguages/${langIso}/subtitles/${subName}/characters/${data[i].name}`);
      charRef.set(data[i], {merge: true})
        .then(s => {})
        .catch(err => {
          console.error(err)
          return false
        })
    }
    return true
  }

  deleteCharacter(uid: any, videoId: any, langIso: any, subName: any, data: any){
    subName = subName.split(".")[0]
    for(let i = 0; i < data.length; i++) {
      let charRef = this.firestore.doc(`users/${uid}/videos/${videoId}/subtitleLanguages/${langIso}/subtitles/${subName}/characters/${data[i].name}`);
      charRef.delete()
        .then(() => {})
        .catch(err => {
          console.error(err)
          return false
        })
    }
    return true
  }

}
