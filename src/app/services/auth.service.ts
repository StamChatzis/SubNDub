import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { GoogleAuthProvider } from '@angular/fire/auth';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { GmailUser, Video } from 'src/app/models/firestore-schema/user.model';
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})

export class AuthService  {
  private readonly user$: Observable<GmailUser>;
  private loggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  get user(): Observable<GmailUser> {
    return this.user$;
  }

  get isLoggedIn(): boolean {
    return this.loggedIn$.value;
  }

  constructor(private fireAuth: AngularFireAuth,
              private firestore: AngularFirestore,
              private router: Router,
              private snackbar: MatSnackBar) {
    this.user$ = this.fireAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          this.loggedIn$.next(true);
          return this.firestore.doc<GmailUser>(`users/${user.uid}`).valueChanges();
        } else {
          this.loggedIn$.next(false);
          return of(null);
        }
      })
    );
  }

  async googleSignIn() {
    const provider = new GoogleAuthProvider();
    const credential = await this.fireAuth.signInWithPopup(provider);
    if (credential.user) {
      const ifUserExist: AngularFirestoreDocument = this.firestore.doc(`users/${credential.user.uid}`);
      ifUserExist.get().subscribe(docSnapshot => {
        if(docSnapshot.exists){
          this.updateUserData(credential.user);
          this.router.navigate(['dashboard']);
        }else{
          this.createNewUserData(credential.user);
          this.snackbar.open('As a new user please set up your account', 'OK', {duration: 6000});
          this.router.navigate(['profile']);
        }
      })

    }
  }

  async signOut() {
    await this.fireAuth.signOut();
    this.router.navigate(['']);
  }

  private createNewUserData(user: GmailUser){
    //add new user data to firestore with default settings
    const userDataRef: AngularFirestoreDocument<GmailUser> = this.firestore.doc(`users/${user.uid}`);

    const newUserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      bio: '',
      ethnicity: '',
      mother_language: ''
    }

    return userDataRef.set(newUserData);
  }

  private updateUserData(user: GmailUser) {
    //update user data to firestore database on login
    const userRef: AngularFirestoreDocument<GmailUser> = this.firestore.doc(`users/${user.uid}`);
    const data = {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL
    }

    return userRef.set(data, {merge: true});
  }
}
