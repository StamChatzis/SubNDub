import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, switchMap, take, tap } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { MatDialog } from '@angular/material/dialog';
import { UnsavedChangesDialogComponent } from '../components/dialog-modal/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { ShareService } from '../services/share.service';
import { SharedVideo } from '../models/firestore-schema/shared-video.model';
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
  dataSource: any[];
  publishDate: BehaviorSubject<string> = new BehaviorSubject<string>('');
  readonly regionNamesInEnglish = new Intl.DisplayNames(['en'], { type: 'language' });

  @ViewChild('translateMenu') translateMenu;

  displayedColumns = ['Name','Format','Language','Last Updated','Subtitles'];
  constructor(private route: ActivatedRoute, 
    private router: Router,
    private youtubeService: YoutubeService,
    public dialog: MatDialog,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private translateService: GoogleTranslateService,
    private detailsViewService: DetailsViewServiceService,
    private shareService: ShareService) { }

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
      })).subscribe(languages => {
      this.dataSource = languages;
    });
    this.getVideoDetails();
    this.getCaptionDetails();
    this.getSupportedLanguages();
  }

  getVideoDetails(): void {
    this.youtubeService.getVideoDetails(this.videoId).pipe(
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

  

  editSubtitle(ISOcode:string, name:string, usersRights: string[]): void {
    const userRight = usersRights.find((right: any) => right["userEmail"] === this.user$.value.email);
    let right: string;
    if (userRight["right"] === 'Viewer') right = "Viewer";
    else if (userRight["right"] === 'Commenter') right = "Commenter";
    else right="";
    this.router.navigate(['edit/shared', this.videoId, ISOcode, name, right]);
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
            if (dialog === (null || undefined )){
              //this.snackbar.open('No changes have been made', 'DISMISS', {duration:1000}); 
              this.dialog.closeAll();
            }else if(dialog){
              if (dialog.email && dialog.right) {
                this.detailsViewService.shareSubtitle(this.videoId, ISOcode, language, this.user$.value.uid, filename, format, dialog.email, dialog.right, subtitleId);
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



}
