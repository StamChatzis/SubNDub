import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, switchMap, take, tap } from 'rxjs';
import { SupportedLanguages } from 'src/app/models/google/google-supported-languages';
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
import { DialogConfirmationComponent } from "../../shared/components/dialog-confirmation/dialog-confirmation.component";
import { NoopScrollStrategy } from "@angular/cdk/overlay";
import { StorageService } from "../../services/storage.service";
import { DownloadFileHandlerService } from "../../services/download-file-handler.service";
import { RequestCommunityHelpComponent } from '../dialog-modal/request-community-help/request-community-help.component';
import { UserService } from "../../services/user.service";
import {ProfilePreviewDialogComponent} from "../dialog-modal/profile-preview-dialog/profile-preview-dialog.component";
import { ViewonlyModeDialogComponent } from '../dialog-modal/viewonly-mode-dialog/viewonly-mode-dialog.component';
import { CommunityHelpService } from 'src/app/services/community-help.service';

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
  dataSource: any[] = [];
  publishDate: BehaviorSubject<string> = new BehaviorSubject<string>('');
  readonly regionNamesInEnglish = new Intl.DisplayNames(['en'], { type: 'language' });

  @ViewChild('translateMenu') translateMenu;

  displayedColumns = ['Name', 'Format', 'Language', 'Last Updated', 'Owner', 'Subtitles'];
  constructor(private route: ActivatedRoute,
    private router: Router,
    private youtubeService: YoutubeService,
    public dialog: MatDialog,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private userService: UserService,
    private storageService: StorageService,
    private translateService: GoogleTranslateService,
    private detailsViewService: DetailsViewServiceService,
    private downloadFileService: DownloadFileHandlerService,
    private communityService: CommunityHelpService,
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

  addSubtitle(): void {
    this.dialog.open(SaveSubtitleDialogComponent, {width: '500px'})
      .afterClosed().pipe(take(1)).subscribe(dialog => {
        if (dialog) {
          let flag = false;
          for(let i = 0; i < this.dataSource.length; i++){
            if(dialog.name === this.dataSource[i].fileName && dialog.language.language === this.dataSource[i].iso){
              flag = true;
            }
          }
          if(flag) {
            this.snackbar.open('You already have a subtitle with this name and this language', 'DISMISS', {duration: 5000});
          }else{
              this.detailsViewService.addSubtitle(this.videoId, dialog.language, this.user$.value.uid, dialog.name, dialog.format, this.user$.value.email);
          }
        }
    })
  }

  editSubtitle(ISOcode:string, name:string, isUsed:boolean, subtitleId: string, language:any): void {
    if (isUsed == null || isUsed == undefined){
      this.router.navigate(['edit', this.videoId, ISOcode, name, language, subtitleId])
    }else {
      this.shareService.getSubtitleIsUsed(this.videoId, ISOcode, language, name, subtitleId).then((subtitleIsUsed) => {
        if (subtitleIsUsed == null || subtitleIsUsed.isUsed == undefined || subtitleIsUsed.isUsed == null || subtitleIsUsed.isUsedBy == this.user$.value.uid)
          this.router.navigate(['edit', this.videoId, ISOcode, name, language ,subtitleId])
        else if (!isUsed)
          this.router.navigate(['edit', this.videoId, ISOcode, name, language, subtitleId])
        else {
          this.communityService.getEmailFromUserID(subtitleIsUsed.isUsedBy).subscribe(isUsedEmail => {
            this.dialog.open(ViewonlyModeDialogComponent,{width:'400px', data: {displayName:isUsedEmail}}).afterClosed().pipe(take(1)).subscribe(dialog => {
              if (dialog == null || dialog == (undefined)){
                this.dialog.closeAll();
              }else if (dialog){
                this.router.navigate(['edit/shared', this.videoId, this.user$.value.uid, ISOcode, name, language, "Viewer", subtitleId]);
              }});
          })
        }
      });
    }
    
  }

  requestCommunityHelp(language:string ,iso: string, filename: string, format: string, videoTitle: string, subtitleId: string): void {
    this.dialog.open(RequestCommunityHelpComponent,{width:'400px', data: { videoTitle, subtitleTitle:filename+"."+format, language}}).afterClosed().pipe(take(1)).subscribe(dialog => {
      if (dialog === null || dialog === undefined ){
        this.dialog.closeAll();
      }else if (dialog){
        this.detailsViewService.requestCommunityHelp(this.user$.value, this.videoId,language, iso, filename, format, dialog, subtitleId);
      }});
  }

  deleteSubtitle(ISOcode:string, name:any, format: any){
    const dialogRef= this.dialog.open(DialogConfirmationComponent, {width:'400px', scrollStrategy: new NoopScrollStrategy(), data: 'Are you sure you want to delete this subtitle? This is irreversible and all related data linked to it will be lost.'});
    const subFileUrl = `subtitles/${this.user$.value.uid}/${this.videoId}/${ISOcode}/${name}.${format}`
    const subUrl = `users/${this.user$.value.uid}/videos/${this.videoId}/subtitleLanguages/${ISOcode}/subtitles/${name}`

    dialogRef.afterClosed().subscribe((deletionFlag) => {
      if (deletionFlag === true) {
        this.detailsViewService.deleteSubtitle(this.videoId, this.user$.value.uid, ISOcode, name)
          .then(() => {
            this.storageService.deleteSubtitleFile(subFileUrl).subscribe({
              next: success => {
                this.snackbar.open('You have successfully deleted this subtitle', 'OK', {duration: 5000});
              },
              error: err => {
                this.snackbar.open('You have successfully deleted this subtitle. The subtitle file had not been created so could not be deleted', 'OK', {duration: 5000});
                console.log(err.message);
              }
            })
          })
          .catch(error => {
            this.snackbar.open('Could not delete subtitle due to unexpected error: ' + error.message, 'OK', {duration: 5000});
          });
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
    this.detailsViewService.getUsersRightsFromSub(this.user$.value.uid, this.videoId, ISOcode, filename, subtitleId).then((currentRights) => {
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

  exportAllSubtitles(){
    if(this.dataSource.length <= 0) {
      this.snackbar.open('There are no subtitles to export!', 'DISMISS', {duration:5000});
    }else {
      this.downloadFileService.massExportSubtitles(this.dataSource, this.videoId, this.user$.value.uid);
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['dashboard']).then(r => r);
  }

  protected readonly open = open;
}
