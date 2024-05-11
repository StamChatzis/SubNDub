import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { User } from "../models/firestore-schema/user.model";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})

export class ProfileService {

  constructor(private fireAuth: AngularFireAuth, private firestore: AngularFirestore, private http: HttpClient) {
  }

  getCountries(){
    const countryUrl = "../../assets/data/google-countries.json";
    return this.http.get(countryUrl);
  }

  updateProfile(user: User) {

  }

}
