import {Component, HostListener} from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  showMenuDD = false;

  constructor(public auth: AuthService) { }

  //function about dropdown profile menu
  toggleDropDown(event: any) {
    if(event.target.classList != undefined) {
      if(this.showMenuDD){
        if(event.target.classList.contains('user-icon')) {
          this.showMenuDD = !this.showMenuDD;
        }else this.showMenuDD = !!event.target.classList.contains('no-hide-dd');
      }else{
        if(event.target.classList.contains('user-icon')) {
          this.showMenuDD = !this.showMenuDD;
        }else{
          this.showMenuDD = false;
        }
      }
    }else{
      this.showMenuDD = false
    }
  }
}
