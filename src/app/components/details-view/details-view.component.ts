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
    private detailsViewService: DetailsViewServiceService) { }

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

  addSubtitle(language: Language): void {
    this.dialog.open(SaveSubtitleDialogComponent,{width:'500px', data: language.name}).afterClosed().pipe(take(1)).subscribe(dialog => {
      if (dialog?.name) {
        this.detailsViewService.addSubtitle(this.videoId, language, this.user$.value.uid, dialog.name, dialog.format, this.user$.value.email);
      }
    })
  }

  editSubtitle(ISOcode:string, name:string): void {
    this.router.navigate(['edit', this.videoId, ISOcode, name])
  }

  requestCommunityHelp(language:string ,iso: string, filename: string, format: string): void {
    this.detailsViewService.requestCommunityHelp(this.user$.value, this.videoId,language, iso, filename, format)
  }

  shareSubtitle(language:string, ISOcode:string ,filename: string, format: string, usersRights: string[]) : void { 
    this.dialog.open(ShareSubtitleDialogComponent,{width:'600px', height:'500px', data: {filename, usersRights}}).afterClosed().pipe(take(1)).subscribe(dialog => {
      if (dialog == null){
        this.snackbar.open('No changes have been made', 'DISMISS', {duration:2000});
      }
      else if (dialog.email && dialog.right) {
        this.detailsViewService.shareSubtitle(this.videoId, ISOcode, language, this.user$.value.uid, filename, format, dialog.email, dialog.right);
      }else if((dialog.email == "" && dialog.right) || (dialog.email && dialog.right == undefined)){
        this.snackbar.open('Both email and right have to be filled', 'DISMISS', {duration:2000});
      }else {
        this.detailsViewService.updateSharedSubtitleRights(this.videoId, ISOcode, language, this.user$.value.uid, filename, format, usersRights);
      }
      

    })
  }

  navigateToDashboard(): void {
    this.router.navigate(['dashboard']);
  }
}