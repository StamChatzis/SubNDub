import { Component, Inject } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommunityHelpService } from 'src/app/services/community-help.service';
import { DetailsViewServiceService } from 'src/app/services/details-view-service.service';
import { NotifierService } from 'src/app/services/notifier.service';

@Component({
  selector: 'app-edit-request-dialog',
  templateUrl: './edit-request-dialog.component.html',
  styleUrls: ['./edit-request-dialog.component.css']
})
export class EditRequestDialogComponent {
  videoTitle: string;
  videoId: string;
  fileName: string;
  requestedByID: string;
  languageRequested: string;
  deadline: any;
  requestorEmail: string;
  newDeadline: any;
  noDeadline: any;
  today: string;
  isChecked: boolean = false;

  constructor(private firestore: AngularFirestore, private notifier: NotifierService ,private detailsService: DetailsViewServiceService, private communityService: CommunityHelpService, public dialogRef: MatDialogRef<EditRequestDialogComponent>,  @Inject(MAT_DIALOG_DATA) public data: any)
  {
    this.videoTitle = data.videoTitle;
    this.languageRequested = data.language;
    this.videoId = data.videoId;
    this.requestedByID = data.requestedByID;
    this.fileName = data.filename;
    this.today =this.today = new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.firestore.collection('helpRequests', ref => {
      return ref.where('videoId', '==', this.videoId)
            .where('filename', '==', this.fileName) 
            .where('language', '==', this.languageRequested)
            .where('requestedByID', '==', this.requestedByID); 
    })
   .get()
   .subscribe((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        this.deadline = doc.get('deadline');
      });
    });
  }

  onNoDeadlineChange() {
    if (this.noDeadline) {
      this.newDeadline = 'No';
      this.isChecked = false;
    } else {
      this.newDeadline = false;
    }
  }

  onDateInput() {
    this.noDeadline = false;
    this.isChecked = false;
    this.newDeadline = this.newDeadline;
  }
  
  onIsCheckedChange() {
    if (this.isChecked) {
      this.newDeadline = null;
      this.noDeadline = false;
    } 
  }

  changeDeadline(requestCheck: any, newDeadline: any){
    let subId;
    this.communityService.getSharedSubID(this.requestedByID,this.videoId,this.data.requestDetails.iso,this.fileName).subscribe((subID) => {
      if(subID==undefined)
        subId = "";
      else
        subId = subID;
    })

    this.firestore.collection('users', ref => {
      return ref.where('uid', '==', this.requestedByID);
    })
   .get()
   .subscribe((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        this.requestorEmail = doc.get('email');

        this.firestore.collection('helpRequests', ref => {
          return ref.where('videoId', '==', this.videoId)
                .where('filename', '==', this.fileName) 
                .where('language', '==', this.languageRequested)
                .where('requestedByID', '==', this.requestedByID)
                .where('status', '==', 'open'); 
        })
      .get()
      .subscribe((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const offerList = doc.get('offerList');
            let data;
            if(requestCheck == true){
              doc.ref.update({ status: "closed" });

              data = { 
                sender: this.data.userEmail,
                recipient: this.requestorEmail,
                subject: "Subtitle: "+this.fileName+"."+this.data.requestDetails.format,
                createdAt: Date.now(),
                status: "unread",
                subtitle_name: this.fileName,
                body:"Bid request for this subtitle has been closed.\nThank you for your participation!",
                videoId: this.videoId,
                iso: this.data.requestDetails.iso,
                language: this.languageRequested,
                format: this.data.requestDetails.format,
                videoTitle: this.videoTitle,
                subtitleId: subId
              }
            } 
            else if(newDeadline !== null){
              doc.ref.update({ deadline: newDeadline });

              data = { 
                sender: this.data.userEmail,
                recipient: this.requestorEmail,
                subject: "Subtitle: "+this.fileName+"."+this.data.requestDetails.format,
                createdAt: Date.now(),
                status: "unread",
                subtitle_name: this.fileName,
                body:"Deadline for this subtitle has been updated.\nNew dealine: "+newDeadline,
                videoId: this.videoId,
                iso: this.data.requestDetails.iso,
                language: this.languageRequested,
                format: this.data.requestDetails.format,
                videoTitle: this.videoTitle,
                subtitleId: subId
              }
            }

            if (Array.isArray(offerList)) {
              offerList.forEach((offer) => {
                const userEmail = offer.userEmail;

                let userEmailId;
                      this.detailsService.getUserIdByEmail(userEmail).subscribe((id) => {
                        userEmailId=id
                        const messageRefList: AngularFirestoreCollection = this.firestore.collection('users').doc(userEmailId).collection('messages');
          
                        messageRefList.add(data).then((docRef) => {
                          docRef.update({ id: docRef.id }).catch((err) => this.notifier.showNotification('No info message has been sent', 'DISMISS'));
                        });
                      });
              }) 
            }
          });
        });
      })
    });
  }


}
