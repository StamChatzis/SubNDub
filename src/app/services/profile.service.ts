import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import {GmailUser, User, Video} from "../models/firestore-schema/user.model";
import { HttpClient } from "@angular/common/http";
import { ForeignLanguage, MotherLanguage } from "../models/general/language-skills";

@Injectable({
  providedIn: 'root'
})

export class ProfileService {
  otherLanguages$: Observable<ForeignLanguage[]>;

  constructor(private firestore: AngularFirestore, private http: HttpClient) {}

  getCountries(){
    const countryUrl = "../../assets/data/google-countries.json";
    return this.http.get(countryUrl);
  }

  getSkillLevels(){
    const skillsUrl = "../../assets/data/lang-skill-levels.json";
    return this.http.get(skillsUrl);
  }

  addForeignLanguages(uid: any, foreignLang: ForeignLanguage[]) {
    for(let lang of foreignLang){
      const language = lang.language;
      const langRef: AngularFirestoreDocument<ForeignLanguage> = this.firestore.doc(`users/${uid}/languages/${language}`);
      langRef.set(lang, {merge: true}).catch(ex => {
        console.log(ex.message)
        return false
      });
    }
    return true
  }

  getAllLanguages(uid: string): Observable<ForeignLanguage[]> {
    return this.otherLanguages$ = this.firestore.collection<ForeignLanguage>(`users/${uid}/languages/`).valueChanges();
  }

  updateProfile(user: any) {
    const userRef: AngularFirestoreDocument<GmailUser> = this.firestore.doc(`users/${user.uid}`)
    return userRef.update(user)
  }

  deleteForeignLang(uid:any, language:any){
    const userRef: AngularFirestoreDocument<ForeignLanguage> = this.firestore.doc(`users/${uid}/languages/${language}`)
    return userRef.delete();
  }

}
