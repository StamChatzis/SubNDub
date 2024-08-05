import {Component, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeService } from '../services/youtube.service';
import { BehaviorSubject, map, Observable, take, tap } from 'rxjs';
import { YoutubeVideoDetails } from '../models/youtube/youtube-response.model';
import { StorageService } from '../services/storage.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { MatDialog } from '@angular/material/dialog';
import { UnsavedChangesDialogComponent } from '../components/dialog-modal/unsaved-changes-dialog/unsaved-changes-dialog.component';
import {Language, SupportedLanguages} from "../models/google/google-supported-languages";
import { GoogleTranslateService } from "../services/googletranslate.service";

@Component({
  selector: 'subtitling-container',
  templateUrl: './subtitling-container.component.html',
  styleUrls: ['./subtitling-container.component.css'],
  providers: [StorageService]
})
export class SubtitlingContainerComponent implements OnInit {

  videoId: string;
  languageIsoCode: string;
  _currentLanguage$: Observable<Language>
  langName$: Observable<string>
  videoLang$: Observable<string>
  fileName: string;
  subFormat: string;
  isFormDirty: boolean = false;
  right: string;
  canOnlyView: boolean;
  availableLanguages$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject<SupportedLanguages>(null);
  videoDetails$: BehaviorSubject<YoutubeVideoDetails[]> = new BehaviorSubject<YoutubeVideoDetails[]>(null);
  videoDuration: BehaviorSubject<string> = new BehaviorSubject<string>('');
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private storage: AngularFireStorage,
    private googleLangService: GoogleTranslateService,
    public dialog: MatDialog,
    protected youtube: YoutubeService) {}

  ngOnInit(): void {
    this.videoId = this.route.snapshot.paramMap.get('id');
    this.languageIsoCode = this.route.snapshot.paramMap.get('languageCode');
    this.fileName = this.route.snapshot.paramMap.get('name');
    this.subFormat = this.route.snapshot.paramMap.get('format')
    this.right = this.route.snapshot.paramMap.get('right');
    this.canOnlyView = !!this.right;

    this.youtube.getAllVideoDetails(this.videoId).pipe(take(1),tap(() => {
      this.loading$.next(true);
    })).subscribe((res) => {
      if (res) {
        this.videoDetails$.next(res);
        this.videoDuration.next(this.videoDetails$.value[0].contentDetails.duration);
        this.loading$.next(false);
      }
    })
    this.getAvailableLanguages();
  }

  get currentLanguage$(): Observable<Language>{
    return this._currentLanguage$
  }

  setFormDirtyStatus(isDirty: boolean): void {
    this.isFormDirty = isDirty;
  }

  setLoading(load: boolean){
    this.loading$.next(load);
  }

  uploadToFirestorage(subtitle: Blob): void {
    this.isFormDirty = false;
    this.storageService.createFirestorageRef(this.storage, this.languageIsoCode, subtitle, this.videoId, this.fileName);
  }

  navigateTTS(): void {
    this.router.navigate(['generate-tts', this.videoId, this.languageIsoCode]);
  }

  getAvailableLanguages(): void {
    this.googleLangService.getSupportedLanguages()
      .pipe(tap(() => {
        this.loading$.next(true)
      }))
      .subscribe((response: SupportedLanguages) => {
        this.availableLanguages$.next(response);
        this.loading$.next(false)
        this._currentLanguage$ = this.availableLanguages$
          .pipe(map(lang => lang!.data!.languages
            .find(language => language.language === this.languageIsoCode))
        );
        this.langName$ = this.availableLanguages$
          .pipe(map(lang => lang!.data!.languages
            .find(language => language.language === this.languageIsoCode)?.name)
          )
        this.youtube.getAllVideoDetails(this.videoId).subscribe({
          next: data => {
            this.videoLang$ = this.availableLanguages$
              .pipe(map(lang => lang!.data!.languages
                .find(language => language.language === data[0].snippet.defaultAudioLanguage)?.name))
          }
        })
      });
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
