import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, switchMap, take, tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ShareService } from '../services/share.service';
import { GoogleTranslateService } from '../services/googletranslate.service';
import { DetailsViewServiceService } from '../services/details-view-service.service';
import { YoutubeVideoDetails } from '../models/youtube/youtube-response.model';
import { SupportedLanguages } from '../models/google/google-supported-languages';
import { GmailUser } from '../models/firestore-schema/user.model';
import { timeSince } from '../components/video-card/video-card.component';
import { YoutubeService } from '../services/youtube.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { ShareSubtitleDialogComponent } from '../components/dialog-modal/share-subtitle-dialog/share-subtitle-dialog.component';
import { UserService } from "../services/user.service";
import {
  ProfilePreviewDialogComponent
} from "../components/dialog-modal/profile-preview-dialog/profile-preview-dialog.component";
import {UserRights} from "../models/firestore-schema/subtitles.model";
import { ViewonlyModeDialogComponent } from '../components/dialog-modal/viewonly-mode-dialog/viewonly-mode-dialog.component';
import { CommunityHelpService } from '../services/community-help.service';

@Component({
  selector: 'app-share-subtitling-container',
  templateUrl: './share-subtitling-container.component.html',
  styleUrls: ['./share-subtitling-container.component.css'],
  providers: [GoogleTranslateService, DetailsViewServiceService]
})
export class ShareSubtitlingContainerComponent implements OnInit {
  videoId: string;
  videoDetails$: BehaviorSubject<YoutubeVideoDetails[]> = new BehaviorSubject<YoutubeVideoDetails[]>(null);
  videoCaptionDetails$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(null);
  supportedLanguages$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject<SupportedLanguages>(null);
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  user$: BehaviorSubject<GmailUser> = new BehaviorSubject<GmailUser>(null);
  publishDate: BehaviorSubject<string> = new BehaviorSubject<string>('');
  dataSource: any[] = [];
  readonly regionNamesInEnglish = new Intl.DisplayNames(['en'], { type: 'language' });

  @ViewChild('translateMenu') translateMenu;

  displayedColumns = ['Name','Format','Language','Last Updated', 'Owner', 'Subtitles'];
  constructor(private route: ActivatedRoute,
    private router: Router,
    private youtubeService: YoutubeService,
    public dialog: MatDialog,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private translateService: GoogleTranslateService,
    private detailsViewService: DetailsViewServiceService,
    private shareService: ShareService,
    private communityService: CommunityHelpService,
    private userService: UserService) { }

  ngOnInit(): void {
    this.videoId = this.route.snapshot.paramMap.get('id');

    this.authService.user.pipe(take(1),
      switchMap(user => {
        if (user) {
          this.user$.next(user);
          return this.shareService.getSharedSubtitleLanguages(this.user$.value.email, this.videoId);
        } else {
          return of(null); // Return an empty observable if there is no user
        }
      })).subscribe({
      next: response => {
        this.loadDataSourceOwnerDetails(response);
      },
      error: err => {
        this.snackbar.open('Could not load data due to an unexpected error: ' + err.message, 'OK', {duration: 5000});
      }
    });
    this.getVideoDetails();
    this.getCaptionDetails();
    this.getSupportedLanguages();
  }

  loadDataSourceOwnerDetails(response: any[]){
    this.dataSource = response;
    for(let i = 0; i < response.length; i++){
      this.userService.getUserDetails(response[i].usersRights.find(user => user.right === 'Owner').userUid).pipe(take(1)).subscribe({
        next: response => {
          this.dataSource[i].ownerName = response.data().displayName
          this.dataSource[i].ownerPhoto = response.data().photoURL
        }
      })
    }
  }

  getVideoDetails(): void {
    this.youtubeService.getAllVideoDetails(this.videoId).pipe(
      tap(() => {
        this.loading$.next(true);
      })).subscribe((res) => {
      if (res) {
        this.videoDetails$.next(res);
        this.loading$.next(false);
        this.publishDate.next(timeSince(new Date(this.videoDetails$.value[0]?.snippet?.publishedAt)));
      }
    });
  }

  getCaptionDetails(): void {
    this.youtubeService.getCaptionDetails(this.videoId).pipe(
      tap(() => {
        this.loading$.next(true);
      })).subscribe((res) => {
      if (res) {
        this.videoCaptionDetails$.next(res);
        this.loading$.next(false);
      }
    });
  }

  getSupportedLanguages(): void {
    this.translateService.getSupportedLanguages()
    .pipe(tap(() => {
      this.loading$.next(true)
    }))
    .subscribe((response: SupportedLanguages) => {
      this.supportedLanguages$.next(response);
      this.loading$.next(false)
    });
  }

  editSubtitle(ISOcode:string, name:string, usersRights: UserRights[], subtitleId:string, language:string): void {
    const ownerId = usersRights.find(user => user.right === 'Owner').userUid
    const userRight = usersRights.find((right: any) => right["userEmail"] === this.user$.value.email);
    let right: string;
    if (userRight["right"] === 'Viewer') right = "Viewer";
    else if (userRight["right"] === 'Commenter') right = "Commenter";
    else if (userRight["right"] === 'Editor') right = "Editor";
    else right="";
  
    this.shareService.getSubtitleIsUsed(this.videoId, ISOcode, language, name, subtitleId).then((subtitleIsUsed) => {
      if (subtitleIsUsed == null || !subtitleIsUsed.isUsed || subtitleIsUsed.isUsedBy == this.user$.value.uid){
        this.router.navigate(['edit/shared', this.videoId, ownerId, ISOcode, name, language, right, subtitleId]);
      }else  {
        this.communityService.getEmailFromUserID(subtitleIsUsed.isUsedBy).subscribe(isUsedEmail => {
          this.dialog.open(ViewonlyModeDialogComponent,{width:'400px', data: {displayName:isUsedEmail}}).afterClosed().pipe(take(1)).subscribe(dialog => {
            if (dialog == null || dialog == (undefined)){
              this.dialog.closeAll();
            }else if (dialog){
              this.router.navigate(['edit/shared', this.videoId, this.user$.value.uid, ISOcode, name, language, "Viewer", subtitleId]);
            }});
        })
      }
    })
  }

  openProfilePreviewDialog(element: any){
    const dialogRef= this.dialog.open(ProfilePreviewDialogComponent, {width:'400px', data: element});
    dialogRef.afterClosed().pipe(take(1)).subscribe(response => {

    })
  }

  shareSubtitle(language:string, ISOcode:string ,filename: string, format: string, usersRights: string[], videoTitle:string, subtitleId: string) : void {
    let owner_text = "";
    if(subtitleId === undefined)
        subtitleId = "";
    this.detailsViewService.getUsersRightsFromSharedSub(this.user$.value.uid, this.videoId, ISOcode, filename, subtitleId, language).then((currentRights) => {
      usersRights = currentRights;
      this.shareService.getRequestOwnerEmail(this.videoId, ISOcode, language, filename, subtitleId).then((requestOwnerEmail) => {
        if (requestOwnerEmail){
           owner_text = requestOwnerEmail;
        }
          this.dialog.open(ShareSubtitleDialogComponent,{width:'600px', id: 'shared-dialog',data: {filename, usersRights, videoId:this.videoId, ISOcode, language, owner_text, format, videoTitle, subtitleId, userEmail:this.user$.value.email}}).afterClosed().pipe(take(1)).subscribe(dialog => {
            if (dialog === null || dialog === undefined ){
              this.dialog.closeAll();
            }else if(dialog){
              if (dialog.email && dialog.right) {
                this.detailsViewService.shareSubtitle(this.videoId, ISOcode, language, this.user$.value.uid, filename, format, dialog.email, dialog.right, subtitleId, dialog.sendNotification);
              }else if((dialog.email == "" && dialog.right) || (dialog.email && dialog.right == undefined)){
                this.snackbar.open('Both email and right have to be filled', 'DISMISS', {duration:3000});
              }else {
                this.detailsViewService.updateSharedSubtitleRights(this.videoId, ISOcode, language, this.user$.value.uid, filename, format, usersRights, subtitleId);
              }
            }
          });
      })
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['dashboard']);
  }

  protected readonly console = console;
}
