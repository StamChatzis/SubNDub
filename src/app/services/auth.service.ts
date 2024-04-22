import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { GoogleAuthProvider } from '@angular/fire/auth';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { GmailUser, Video } from 'src/app/models/firestore-schema/user.model';

@Injectable({
  providedIn: 'root'
})

export class AuthService  {
  private user$: Observable<GmailUser>;
  private loggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  get user(): Observable<GmailUser> {
    return this.user$;
  }

  get isLoggedIn(): boolean {
    return this.loggedIn$.value;
  }

  constructor(private fireAuth: AngularFireAuth, private firestore: AngularFirestore,
    private router: Router) {
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

  async googleSignin() {
    const provider = new GoogleAuthProvider();
    const credential = await this.fireAuth.signInWithPopup(provider);
    if (credential.user) this.router.navigate(['dashboard']);
    this.updateUserData(credential.user);
  }

  async signOut() {
    await this.fireAuth.signOut();
    this.router.navigate(['']);
  }

  private updateUserData(user: GmailUser) {
    //add user to firestore database on login
    const userRef: AngularFirestoreDocument<GmailUser> = this.firestore.doc(`users/${user.uid}`);

    const data = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }

    return userRef.set(data, {merge: true});
  }
}
