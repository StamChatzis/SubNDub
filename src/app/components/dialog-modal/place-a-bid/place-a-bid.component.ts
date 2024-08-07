import { Component, Inject } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommunityHelpService } from 'src/app/services/community-help.service';

@Component({
  selector: 'app-place-a-bid',
  templateUrl: './place-a-bid.component.html',
  styleUrls: ['./place-a-bid.component.css']
})
export class PlaceABidComponent {
  videoTitle: string;
  videoId: string;
  fileName: string;
  requestedByID: string;
  languageRequested: string;
  yourBidAmount: number;
  deadline: any;
  requestorEmail: string;
  bidDeadline: any;
  today: string;

  constructor(private firestore: AngularFirestore, private communityService: CommunityHelpService, public dialogRef: MatDialogRef<PlaceABidComponent>,  @Inject(MAT_DIALOG_DATA) public data: any,private snackbar: MatSnackBar)
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

  placeBid(userBidAmount: number, deadline: any) {
    let userName;
    this.communityService.getUserNameFromEmail(this.data.userEmail).subscribe((email) => {
        userName =email;
    });

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
        
        const data = { 
          sender: this.data.userEmail,
          recipient: this.requestorEmail,
          subject: "Offer for helping with subtitle: "+this.fileName+"."+this.data.requestDetails.format,
          createdAt: Date.now(),
          status: "unread",
          subtitle_name: this.fileName,
          body:userName+" place the below bid for this subtitle.\nBid: "+userBidAmount+"€"+"\nDeadline: "+deadline,
          videoId: this.videoId,
          iso: this.data.requestDetails.iso,
          language: this.languageRequested,
          format: this.data.requestDetails.format,
          videoTitle: this.videoTitle,
          subtitleId: subId
        }
  
        const messageRef: AngularFirestoreCollection = this.firestore.collection('users').doc(this.requestedByID).collection('messages');
  
        messageRef.add(data).then((docRef) => {
          docRef.update({ id: docRef.id });

          this.firestore.collection('helpRequests', ref => {
            return ref.where('videoId', '==', this.videoId)
                  .where('filename', '==', this.fileName) 
                  .where('language', '==', this.languageRequested)
                  .where('requestedByID', '==', this.requestedByID); 
          })
         .get()
         .subscribe((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              const offerList = doc.get('offerList');
              if (Array.isArray(offerList)) {
                const existingOffer = offerList.find(offer => offer.userEmail === this.data.userEmail);
                if (!existingOffer) {
                  offerList.push({
                    userEmail: this.data.userEmail,
                    userBid: userBidAmount,
                    userDeadline: deadline
                  });
                  doc.ref.update({ offerList: offerList });
                } else {
                  existingOffer.userBid = userBidAmount;
                  existingOffer.userDeadline = deadline;
                  doc.ref.update({ offerList: offerList });
                }
              } else {
                const newOfferList = [{
                  userEmail: this.data.userEmail,
                  userBid: userBidAmount,
                  userDeadline: deadline
                }];
                doc.ref.update({ offerList: newOfferList });
              }
            });
          });


        })
       .catch((err) => this.snackbar.open('No offer message has been sent', 'DISMISS', {duration:2000}));
      });
    });

  }
}
