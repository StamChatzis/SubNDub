import {Injectable} from "@angular/core";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {GmailUser} from "../models/firestore-schema/user.model";
import {take} from "rxjs";

@Injectable({
  providedIn: 'root'
})

export class UserService  {

  constructor(private firestore: AngularFirestore){}

  user: GmailUser

  getUserDetails(uid: any){
    return this.firestore.doc<GmailUser>(`users/${uid}`).get()
  }

}
