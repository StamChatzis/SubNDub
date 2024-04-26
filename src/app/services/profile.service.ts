import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {User} from "../models/firestore-schema/user.model";

@Injectable({
  providedIn: 'root'
})

export class ProfileService {

  constructor(private fireAuth: AngularFireAuth, private firestore: AngularFirestore) {
  }

  updateProfile(user: User) {

  }

}
