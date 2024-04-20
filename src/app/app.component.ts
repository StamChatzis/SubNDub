import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  showMenuDD = false;

  constructor(public auth: AuthService) { }

  toggleDropDown(event: any) {
    if(event.target.classList != undefined) {
      if(event.target.classList.contains('user-icon')) {
        this.showMenuDD = !this.showMenuDD
        return this.showMenuDD;
      }
      else{
        this.showMenuDD = false;
        return this.showMenuDD;
      }
    }else{
      this.showMenuDD = false
      return this.showMenuDD;
    }
  }
}
