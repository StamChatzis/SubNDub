import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessagesService } from 'src/app/services/messages.service';
import { Message } from 'src/app/models/firestore-schema/message.model';
import {BehaviorSubject, pipe, map, switchMap, of} from 'rxjs';
import { GmailUser } from 'src/app/models/firestore-schema/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { DetailsViewServiceService } from 'src/app/services/details-view-service.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
  providers: [DetailsViewServiceService, MessagesService]
})
export class MessagesComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  useruid: string;
  userEmail: string;
  messagesSubscription: any;

  constructor(private messagesService: MessagesService, private authService: AuthService){}

  ngOnInit(): void {
    this.authService.user.subscribe((id) => {
      this.useruid = id.uid;
      this.userEmail = id.email;
  
      const messagesCollection = this.messagesService.getUserMessages(this.useruid);
      const messagesQuery = messagesCollection.stateChanges();
      this.messagesSubscription = messagesQuery.subscribe(changes => {
        changes.forEach(change => {
          if (change.type === 'added') {
            const data = change.payload.doc.data();
            this.messages.push({
              id: change.payload.doc.id,
              sender: data.sender,
              recipient: data.recipient,
              subject: data.subject,
              createdAt: data.createdAt,
              subtitle_name: data.subtitle_name,
              body: data.body,
              videoId: data.videoId,
              status: data.status,
              iso: data.iso,
              language: data.language,
              format: data.format
            } as Message);
          } else if (change.type === 'removed') {
            const index = this.messages.findIndex(message => message.id === change.payload.doc.id);
            if (index >= 0) {
              this.messages.splice(index, 1);
            }
          } else if (change.type === 'modified') {
            const data = change.payload.doc.data();
            const index = this.messages.findIndex(message => message.id === change.payload.doc.id);
            if (index >= 0) {
              this.messages[index] = {
                id: change.payload.doc.id,
                sender: data.sender,
                recipient: data.recipient,
                subject: data.subject,
                createdAt: data.createdAt,
                subtitle_name: data.subtitle_name,
                body: data.body,
                videoId: data.videoId,
                status: data.status,
                iso: data.iso,
                language: data.language,
                format: data.format
              } as Message;
            }
          }
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.messagesSubscription.unsubscribe();
  }



  getMessages(useruid: string, userEmail: string) {
    this.messagesService.getUserMessages(useruid)
      .snapshotChanges()
      .pipe(
        switchMap(actions => {
          this.messages = actions.map(action => {
            const data = action.payload.doc.data();
            const id = action.payload.doc.id;
            return {
              id,
              sender: data.sender,
              recipient: data.recipient,
              subject: data.subject,
              createdAt: data.createdAt,
              subtitle_name: data.subtitle_name,
              body: data.body,
              videoId: data.videoId,
              status: data.status,
              iso: data.iso,
              language: data.language
              // Add other properties required by the Message type
            } as Message;
          }).filter(message => message.recipient === userEmail);
          return of(actions);
        })
      )
      .subscribe();
    }

  acceptTransferOwnership(message: Message){
     this.messagesService.updateSub(message)
     .then(() => this.messagesService.resetRequestOwnerEmail(message))
     .catch(error => console.error(error))
     .then(() => this.messagesService.deleteMessageFromUserMessages(message, this.useruid))
     .catch(error => console.error("Error accepting transfer ownership:", error));
     
    
  }

  declineTransferOwnership(message: Message){
    this.messagesService.resetRequestOwnerEmail(message)
   .then(() => this.messagesService.deleteMessageFromUserMessages(message, this.useruid))
   .catch(error => console.error("Error declining transfer ownership:", error));
  }



}
