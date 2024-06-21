import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeService } from '../services/youtube.service';
import { BehaviorSubject, take, tap } from 'rxjs';
import { YoutubeVideoDetails } from '../models/youtube/youtube-response.model';
import { StorageService } from '../services/storage.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UnsavedChangesDialogComponent } from '../components/dialog-modal/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { UploadSubtitle } from './dialog-component/dialog-component.component';


@Component({
  selector: 'subtitling-container',
  templateUrl: './subtitling-container.component.html',
  styleUrls: ['./subtitling-container.component.css'],
  providers: [StorageService]
})
export class SubtitlingContainerComponent implements OnInit {

  videoId: string;
  currentLanguage: string;
  fileName: string;
  subFormat: string;
  videoDetails$: BehaviorSubject<YoutubeVideoDetails[]> = new BehaviorSubject<YoutubeVideoDetails[]>(null);
  videoDuration: BehaviorSubject<string> = new BehaviorSubject<string>('');
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  isFormDirty: boolean = false;
  private storage: AngularFireStorage = inject(AngularFireStorage);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    protected youtube: YoutubeService,
    public dialog: MatDialog) { }

  ngOnInit(): void {
    this.videoId = this.route.snapshot.paramMap.get('id');
    this.currentLanguage = this.route.snapshot.paramMap.get('languageCode');
    this.fileName = this.route.snapshot.paramMap.get('name');
    this.subFormat = this.route.snapshot.paramMap.get('format')

    this.youtube.getVideoDetails(this.videoId).pipe(take(1),tap(() => {
      this.loading$.next(true);
    })).subscribe((res) => {
      if (res) {
        this.videoDetails$.next(res);
        this.videoDuration.next(this.videoDetails$.value[0].contentDetails.duration);
        this.loading$.next(false);
      }
    })
  }

  setFormDirtyStatus(isDirty: boolean): void {
    this.isFormDirty = isDirty;
  }

  uploadToFirestorage(subtitle: Blob): void {
    this.isFormDirty = false;
    this.storageService.createFirestorageRef(this.storage, this.currentLanguage, subtitle, this.videoId, this.fileName);
  }

  navigateTTS(): void {
    this.router.navigate(['generate-tts', this.videoId, this.currentLanguage]);
  }

  navigateToDetails(): void {
    const currentUrl = this.route.snapshot.url.join('/');
    if (this.isFormDirty) {
      this.dialog.open(UnsavedChangesDialogComponent, {'width' : '500px' }).afterClosed().subscribe((res) => {
        if (res) {
          if (currentUrl.includes('edit/shared'))
            this.router.navigate(['shared', this.videoId]);
          else
            this.router.navigate(['details', this.videoId]);
        }
      });
    } else {
      if (currentUrl.includes('edit/shared'))
        this.router.navigate(['shared', this.videoId]);
      else
        this.router.navigate(['details', this.videoId]);
    }
  }
}
