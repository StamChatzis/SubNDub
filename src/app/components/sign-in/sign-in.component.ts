import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {
  constructor(public auth: AuthService,private router: Router) { }

  getStarted(): void {
    if (this.auth.isLoggedIn) {
      this.router.navigate(['dashboard']);
    } else {
      this.auth.googleSignIn();
    }
  }
}
