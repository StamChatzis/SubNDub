import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import { GmailUser, User } from "../models/firestore-schema/user.model";
import { HttpClient } from "@angular/common/http";
import { ForeignLanguage } from "../models/general/language-skills";

@Injectable({
  providedIn: 'root'
})

export class ProfileService {
  userLanguages$: Observable<ForeignLanguage[]>;

  constructor(private fireAuth: AngularFireAuth, private firestore: AngularFirestore, private http: HttpClient) {
  }

  getCountries(){
    const countryUrl = "../../assets/data/google-countries.json";
    return this.http.get(countryUrl);
  }

  getLanguageSkills(){

  }

  addLanguage(userUid: string, language: string){
    // const userRef: AngularFirestoreDocument<GmailUser> = this.firestore.doc(`users/${userUid}`);
    // userRef.collection('languages').doc(language).set({language});
    // this.userLanguages$ = this.firestore.collection<ForeignLanguage>(`users/${userUid}/languages/`).valueChanges();
  }

  updateProfile(user: any) {
    const userRef: AngularFirestoreDocument<User> = this.firestore.doc(`users/${user.uid}`)

    return userRef.set(user)
  }

}
