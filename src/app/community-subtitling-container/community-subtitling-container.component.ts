import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { MatDialog } from '@angular/material/dialog';
import { UnsavedChangesDialogComponent } from '../components/dialog-modal/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { CommunityHelpService } from '../services/community-help.service';
import { CommunityHelpRequest } from '../models/firestore-schema/help-request.model';


@Component({
  selector: 'community-subtitling-container',
  templateUrl: './community-subtitling-container.component.html',
  styleUrls: ['./community-subtitling-container.component.css'],
  providers: [StorageService, CommunityHelpService]
})
export class CommunitySubtitlingContainerComponent implements OnInit {

  videoId: string;
  currentLanguage: string;
  requestId: string;
  requestDetails: CommunityHelpRequest;
  videoDuration: string;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  isFormDirty: boolean = false;
  private storage: AngularFireStorage = inject(AngularFireStorage);

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private storageService: StorageService,
    private communityService: CommunityHelpService,
    public dialog: MatDialog) { }

  ngOnInit(): void {
    this.videoId = this.route.snapshot.paramMap.get('id');
    this.currentLanguage = this.route.snapshot.paramMap.get('languageCode');
    this.requestId = this.route.snapshot.paramMap.get('requestId');
    this.storageService.getCommunityRequestDetails(this.requestId).subscribe((data: CommunityHelpRequest) => {
      this.requestDetails = data;
    })
  }

  setFormDirtyStatus(isDirty: boolean): void {
    this.isFormDirty = isDirty;
  }

  uploadToFirestorage(subtitle: Blob): void {
    this.isFormDirty = false;
    this.storageService.createFirestorageRefCommunity(this.storage, subtitle, this.requestId, this.requestDetails);
  }

  navigateTTS(): void {
    this.router.navigate(['generate-tts', this.videoId, this.currentLanguage]);
  }

  navigateToDashboard(): void {
    if (this.isFormDirty) {
      this.dialog.open(UnsavedChangesDialogComponent, {'width' : '500px' }).afterClosed().subscribe((res) => {
        if (res) this.router.navigate(['dashboard']);
      });
    } else {
      this.router.navigate(['dashboard']);
    }
  }
}
