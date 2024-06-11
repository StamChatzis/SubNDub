import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, switchMap, take, tap } from 'rxjs';
import { Language, SupportedLanguages } from 'src/app/models/google/google-supported-languages';
import { YoutubeVideoDetails } from 'src/app/models/youtube/youtube-response.model';
import { AuthService } from 'src/app/services/auth.service';
import { DetailsViewServiceService } from 'src/app/services/details-view-service.service';
import { GoogleTranslateService } from 'src/app/services/googletranslate.service';
import { YoutubeService } from 'src/app/services/youtube.service';
import { SaveSubtitleDialogComponent } from '../dialog-modal/save-subtitle-dialog/save-subtitle-dialog.component';
import { GmailUser } from 'src/app/models/firestore-schema/user.model';
import { timeSince } from '../video-card/video-card.component';
import { ShareSubtitleDialogComponent } from '../dialog-modal/share-subtitle-dialog/share-subtitle-dialog.component';
import { ShareService } from 'src/app/services/share.service';
import {DialogConfirmationComponent} from "../../shared/components/dialog-confirmation/dialog-confirmation.component";
import {NoopScrollStrategy} from "@angular/cdk/overlay";

@Component({
  selector: 'details-view',
  templateUrl: './details-view.component.html',
  styleUrls: ['./details-view.component.css'],
  providers: [GoogleTranslateService, DetailsViewServiceService]
})
export class DetailsViewComponent implements OnInit {
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
          return this.detailsViewService.getSubtitleLanguages(this.user$.value.uid, this.videoId);
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

  addSubtitle(): void {
    this.dialog.open(SaveSubtitleDialogComponent, {width: '500px'})
      .afterClosed().pipe(take(1)).subscribe(dialog => {
        if (dialog) {
          this.detailsViewService.addSubtitle(this.videoId, dialog.language, this.user$.value.uid, dialog.name, dialog.format, this.user$.value.email);
        }
    })
  }

  editSubtitle(ISOcode:string, name:string): void {
    this.router.navigate(['edit', this.videoId, ISOcode, name])
  }

  requestCommunityHelp(language:string ,iso: string, filename: string, format: string): void {
    this.detailsViewService.requestCommunityHelp(this.user$.value, this.videoId,language, iso, filename, format)
  }

  deleteSubtitle(ISOcode:string, name:string){
    const dialogRef= this.dialog.open(DialogConfirmationComponent, {width:'400px', scrollStrategy: new NoopScrollStrategy(), data: 'Are you sure you want to delete this subtitle? This is irreversible and all related data linked to it will be lost.'});
    dialogRef.afterClosed().subscribe((deletionFlag) => {
      if (deletionFlag === true) {
        //this.detailsViewService.deleteSubtitle(this.videoId, this.user$.value.uid, ISOcode, name);
        this.snackbar.open('Under development', 'DISMISS', {duration:3000});
      }
    });
  }

  shareSubtitle(language:string, ISOcode:string ,filename: string, format: string, usersRights: string[], videoTitle:string, subtitleId: string) : void {
    let owner_text = "";
    if(subtitleId === undefined)
        subtitleId = "";
    this.detailsViewService.getUsersRightsFromSub(this.user$.value.uid, this.videoId, ISOcode, filename, subtitleId).then((currentRights) => {
      usersRights = currentRights;
      this.shareService.getRequestOwnerEmail(this.videoId, ISOcode, language, filename, subtitleId).then((requestOwnerEmail) => {
        if (requestOwnerEmail){
           owner_text = requestOwnerEmail;
        }
          this.dialog.open(ShareSubtitleDialogComponent,{width:'600px', id: 'shared-dialog',data: {filename, usersRights, videoId:this.videoId, ISOcode, language, owner_text, format, videoTitle, subtitleId}}).afterClosed().pipe(take(1)).subscribe(dialog => {
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
