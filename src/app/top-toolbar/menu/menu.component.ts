import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { MessagesService } from 'src/app/services/messages.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})

export class MenuComponent implements OnInit, OnDestroy {
  notifications: number = 0;
  subscription: any;

  constructor(public auth: AuthService, public router: Router, private messageService: MessagesService) {}

  ngOnInit(): void {
    this.auth.user.subscribe((id) => {
      this.subscription = this.messageService.getMessagesCount(id.uid).subscribe((count) => {
        this.notifications = count;
      });
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
