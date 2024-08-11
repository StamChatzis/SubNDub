import {Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {BehaviorSubject, Observable, skip, take, tap} from 'rxjs';
import {DialogBox} from 'src/app/models/general/dialog-box.model';
import {GoogleTranslateRequestObject} from 'src/app/models/google/google-translate-request';
import {ImportModel} from 'src/app/models/general/import-sbv.model';
import {GoogleTranslateService} from 'src/app/services/googletranslate.service';
import {UploadFileHandlerService} from 'src/app/services/upload-file-handler.service';
import {GoogleTranslateResponse, GoogleTranslations, ResponseObject} from 'src/app/models/google/google-translate-response'
import {Language, SupportedLanguages} from 'src/app/models/google/google-supported-languages';
import {TimeFormat} from 'src/app/models/general/time-format.model';
import {ChatGPTACtion, TimeEmitterObject} from './dialog-content/dialog-content.component';
import {calculateSeconds, parseTimestamp} from 'src/app/shared/functions/shared-functions';
import {CharacterAssign} from 'src/app/models/general/person-assign.model';
import {MatDialog} from '@angular/material/dialog';
import {PersonCreationDialogComponent} from 'src/app/components/dialog-modal/person-creation-dialog/person-creation-dialog/person-creation-dialog.component';
import {TextContentToSSML} from 'src/app/models/general/gpt-feed.model';
import {GenerateVoiceDialogComponent} from 'src/app/components/dialog-modal/generate-voice-modal/genereate-voice-modal.component';
import {TextToSpeechService} from 'src/app/services/text-to-speech-service.service';
import {StorageService} from 'src/app/services/storage.service';
import {OpenAIService} from 'src/app/services/open-ai.service';
import {ConfirmationModalComponent} from 'src/app/components/dialog-modal/confirmation-modal/confirmation-modal.component';
import {YoutubeService} from 'src/app/services/youtube.service';
import {BatchDialogModalComponent} from 'src/app/components/dialog-modal/batch-dialog-modal/batch-dialog-modal.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CharactersService} from "../../services/characters.service";
import {GmailUser} from "../../models/firestore-schema/user.model";
import {AuthService} from "../../services/auth.service";
import {DownloadOptionsDialogComponent} from "../../components/dialog-modal/download-options-dialog/download-options-dialog.component";
import {DownloadFileHandlerService} from "../../services/download-file-handler.service";
import {TranslateSubsDialogComponent} from "../../components/dialog-modal/translate-subs-dialog/translate-subs-dialog.component";
import {DetectLanguageDialogComponent} from "../../components/dialog-modal/detect-language-dialog/detect-language-dialog.component";
import {LoadingService} from "../../services/loading.service";

@Component({
  selector: 'dialog-component',
  templateUrl: './dialog-component.component.html',
  styleUrls: ['./dialog-component.component.css'],
  providers: [UploadFileHandlerService, GoogleTranslateService, StorageService]
})
export class DialogComponentComponent implements OnInit {
  public user$: Observable<GmailUser>;
  public dialogBoxId: number = 1;
  public _supportedLanguages$: BehaviorSubject<SupportedLanguages> = new BehaviorSubject<SupportedLanguages>(null);
  public _translatedText$: BehaviorSubject<GoogleTranslateResponse> = new BehaviorSubject<GoogleTranslateResponse>(null);
  public subtitles$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public uid: string;
  public form: FormGroup;
  public characters: CharacterAssign[] = [];
  public newCharacters: CharacterAssign[];
  public focusedDialogBox: number;
  public loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  protected isDirty: boolean = false;
  @Input() canOnlyView: boolean;
  @Input() canComment: boolean;
  @Input() initSubtitles: boolean = true;
  @Input() subtitleName: string;
  @Input() videoId: string;
  @Input() isoCode: string;
  @Input() videoDuration: any;
  @Input() currentLanguage$: Observable<Language>
  @Input() ownerId: string;
  @Output() loading$: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() subtitleUploadEmitter: EventEmitter<Blob> = new EventEmitter<Blob>();
  @Output() formStatusChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() navigateTTS: EventEmitter<any> = new EventEmitter<any>();
  @Output() captionsPreviewDispatch: EventEmitter<string> = new EventEmitter<string>();
  @ViewChild('translateMenu') translateMenu;
  @ViewChildren('scrollContainer') scrollContainer: QueryList<any>;

  public dialogBoxes: DialogBox[] = [{
    id: 1,
    text: '',
    start_time: '',
    end_time: ''
  }];

  get supportedLanguages$(): Observable<SupportedLanguages> {
    return this._supportedLanguages$;
  }

  constructor(private fb: FormBuilder,
    private fileService: UploadFileHandlerService,
    private storage: StorageService,
    private google: GoogleTranslateService,
    public dialog: MatDialog,
    private ttsService: TextToSpeechService,
    private openai: OpenAIService,
    private youtube: YoutubeService,
    private snackbar: MatSnackBar,
    private charService: CharactersService,
    private auth: AuthService,
    private downService: DownloadFileHandlerService,
    private loadingService: LoadingService
    ) {}

  ngOnInit(): void {
    this.user$ = this.auth.user;
    this.loading$.emit(true)
    this.user$.subscribe({
      next: user => {
        if (user) {
          this.uid = user.uid
          this.charService.getCharactersOfSubtitle(this.uid, this.videoId, this.isoCode, this.subtitleName)
            .subscribe((data) => {
              if (data){
                this.characters = data;
                this.newCharacters = [...this.characters]
              }
            })
        }
      }
    })

    this.loadingService.loading$.subscribe(isLoading => {
      this.loading.next(isLoading)
    })

    if (this.initSubtitles) {
      if(this.ownerId.length <= 0){
        this.storage.getSubtitleURL(this.videoId, this.isoCode, this.subtitleName).pipe(take(1)).subscribe(url => {
          if (url) {
            this.storage.fetchSubtitleFile(url).subscribe((res: string) => {
              this.subtitles$.next(res);
              this.handleFileUpload({data: this.subtitles$, format: this.subtitleName.split(".")[1]});
            })
          }
        });
      }else{
        this.storage.getSubtitleURLForShared(this.ownerId, this.videoId, this.isoCode, this.subtitleName).pipe(take(1)).subscribe(url => {
          if(url){
            this.storage.fetchSubtitleFile(url).subscribe((res: string) => {
              this.subtitles$.next(res);
              this.handleFileUpload({data: this.subtitles$, format: this.subtitleName.split(".")[1]});
            })
          }
        })
      }
    }

    this.form = this.fb.group({
      '1-dialogBox': this.fb.group({
        subtitles: this.fb.control('', [Validators.pattern('')]),
        start_time: this.fb.control('00:00.000'),
        end_time: this.fb.control('00:02.000'),
        })
    });

    // Subscribe to form status changes
    this.form.statusChanges.pipe().subscribe(() => {
      this.isDirty = this.form.dirty;
      if (this.isDirty) {
        this.formStatusChange.emit(this.isDirty);
      }
    });

    this.youtube.getCurrentTime().pipe(skip(1)).subscribe(currentSecond => {
      const currentDialogBox = this.dialogBoxes.find(dialogBox => {
        const startTimeInSeconds = this.getSecondsFromTime(this.form.get(dialogBox.id + '-dialogBox').get('start_time').value);
        const endTimeInSeconds = this.getSecondsFromTime(this.form.get(dialogBox.id + '-dialogBox').get('end_time').value);
        return currentSecond >= startTimeInSeconds && currentSecond <= endTimeInSeconds;
      });

      if (currentDialogBox) {
        this.setFocusToDialogBoxItem(currentDialogBox.id);
        this.youtube.updateCurrentCaption(this.form.get(currentDialogBox.id + '-dialogBox').get('subtitles').value);
      } else {
        this.focusedDialogBox = undefined;
        this.youtube.updateCurrentCaption(null);
      }
    })
    this.getSupportedLanguages();
    this.loading$.emit(false)
  }

  setLoading(load: boolean){
    this.loading$.emit(load)
  }

  setFocusToDialogBoxItem(dialogBoxItemId: number) {
    this.focusedDialogBox = dialogBoxItemId;
  }

  setFormDirtyStatus(isDirty: boolean){
    this.formStatusChange.emit(isDirty);
  }

  getDialogControl(dialogBoxId: number): FormGroup {
    return this.form.get(dialogBoxId + '-dialogBox') as FormGroup
  }

  setIsFormDirty(isDirty: boolean){
    this.formStatusChange.emit(isDirty);
    this.isDirty = isDirty
  }

  addDialogBox(value: ImportModel = null, fromClick: boolean): void {
    this.dialogBoxId ++;
    this.form.addControl(((this.dialogBoxId + '-dialogBox')), this.fb.group({
      subtitles: this.fb.control((value?.subtitleText) ? value.subtitleText : ''),
      start_time: this.fb.control((value?.start_time) ? value.start_time : this.setStartTimeControlValue()),
      end_time: this.fb.control((value?.end_time) ? value.end_time : this.setEndTimeControlValue()),
    }));

    this.dialogBoxes.push({
      id: this.dialogBoxId,
      text: value?.subtitleText,
      start_time: value?.start_time,
      end_time: value?.end_time
    });

    if(fromClick){
      this.formStatusChange.emit(true);
      this.isDirty = true;
    }
  }

  openDialogForBatchDialogCreation(): void {
    this.dialog.open(BatchDialogModalComponent, {'width': '500px'})
      .afterClosed()
      .pipe(take(1))
      .subscribe({
        next: interval => {
          if (interval > 0) {
            this.batchCreateDialog(interval);
          }
        },
        error: err => {
          console.error(err)
        }
      });
  }

  batchCreateDialog(interval: number){
    this.formStatusChange.emit(true);
    const seconds = this.videoDurationToSeconds(this.videoDuration);
    const controlNames = Object.keys(this.form.controls);
    let lastControlName = controlNames[controlNames.length - 1];

    for (let i = parseInt(lastControlName.split('-')[0]); i < seconds / interval; i ++) {
      this.addDialogBox({
        start_time: this.form.get(i + '-dialogBox').get('end_time').value,
        end_time: this.intervalAddition(this.form.get(i + '-dialogBox').get('end_time').value, interval),
        subtitleText: ''
      }, true);
    }
    this.loadingService.setLoading(false)
  }

  intervalAddition(inputValue: string, intervalInSeconds: number): string {
    // Parse the input time string into minutes, seconds, and milliseconds
    const [minutes, secondsWithMillis] = inputValue.split(':');
    const [seconds, milliseconds] = secondsWithMillis.split('.');

    // Convert everything to milliseconds
    const totalMilliseconds = (parseInt(minutes) * 60 + parseInt(seconds)) * 1000 + parseInt(milliseconds);

    // Add the interval in milliseconds
    const newTotalMilliseconds = totalMilliseconds + intervalInSeconds * 1000;

    // Calculate the new minutes, seconds, and milliseconds
    const newMinutes = Math.floor(newTotalMilliseconds / (60 * 1000));
    const newSeconds = Math.floor((newTotalMilliseconds % (60 * 1000)) / 1000);
    const newMilliseconds = newTotalMilliseconds % 1000;

    // Format the result as "00:00.000"
    return `${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}.${String(newMilliseconds).padStart(3, '0')}`;
  }

  videoDurationToSeconds(duration: any): number {
    let match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    match = match.slice(1).map(function(x) {
      if (x != null) {
          return x.replace(/\D/, '');
      }
    });

    const hours = (parseInt(match[0]) || 0);
    const minutes = (parseInt(match[1]) || 0);
    const seconds = (parseInt(match[2]) || 0);

    return hours * 3600 + minutes * 60 + seconds;
  }

  deleteDialogBox(deleteId: number): void {
    this.form.removeControl(deleteId + '-dialogBox');
    this.dialogBoxes = this.dialogBoxes.filter(dialogBox => dialogBox.id !== deleteId);
  }

  setStartTimeControlValue(): string {
  if (this.dialogBoxes.length) {
      const prevControlIndex = Object.keys(this.form.controls).length - 1;
      const prevControl = Object.keys(this.form.controls);
      const targetControlString = prevControl[prevControlIndex].toString(); // get the string value of the name of last element of the form controls
      return this.form?.get(targetControlString)?.get('end_time')?.value as string;
    } else {
      return '00:00.000';
    }
  }

  setEndTimeControlValue(): string {
    if (this.dialogBoxes.length) {
      const prevControlIndex = Object.keys(this.form.controls).length - 1;
      const prevControl = Object.keys(this.form.controls);
      const targetControlString = prevControl[prevControlIndex].toString();
      const prevEndTime = this.form?.get(targetControlString)?.get('end_time')?.value as string;

      const [prevTime, prevMilliseconds] = prevEndTime.split('.');
      const [minutes, seconds] = prevTime.split(':');

      let newSeconds = parseInt(seconds) + 2;
      let newMinutes = parseInt(minutes);

      if (newSeconds >= 60) {
        newMinutes += Math.floor(newSeconds / 60);
        newSeconds %= 60;
      }

      return `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}.${prevMilliseconds}`;
    } else {
      return '00:02.000';
    }
  }

  timeRangeValidation(dialogContent: TimeEmitterObject): void {
    const prevGroup = this.form.get((dialogContent.id - 1) + '-dialogBox') as FormGroup;
    const currentGroup = this.form.get(dialogContent.id + '-dialogBox') as FormGroup;
    const nextGroup = this.form.get((dialogContent.id + 1) + '-dialogBox') as FormGroup;

    const startTimestampFormatted = parseTimestamp(currentGroup.get('start_time').value);
    const endTimestampFormatted = parseTimestamp(currentGroup.get('end_time').value);

    (dialogContent.control === 'start_time') ?
    this.startTimeValidation(prevGroup, currentGroup, startTimestampFormatted, endTimestampFormatted) :
    this.endTimeValidation(nextGroup, currentGroup, startTimestampFormatted, endTimestampFormatted);
  }

  startTimeValidation(prevGroup: FormGroup, currentGroup: FormGroup, startTimestampFormatted: TimeFormat, endTimestampFormatted: TimeFormat): void {

    if (calculateSeconds(startTimestampFormatted) > calculateSeconds(endTimestampFormatted)) {
      currentGroup.get('start_time').setErrors({higherStartTime:true});
    } else {
      currentGroup.get('start_time').setErrors(null);
    }

    if (prevGroup) {
      const prevEndTimestampFormatted = parseTimestamp(prevGroup?.get('end_time')?.value);
      if (calculateSeconds(prevEndTimestampFormatted) > calculateSeconds(startTimestampFormatted)) {
        currentGroup.get('start_time').setErrors({higherPrevEndTime:true});
        prevGroup.get('end_time').setErrors({higherPrevEndTime:true});
      } else if (calculateSeconds(startTimestampFormatted) > calculateSeconds(endTimestampFormatted)) {
        currentGroup.get('start_time').setErrors({higherStartTime:true});
      } else {
        currentGroup.get('start_time').setErrors(null);
        prevGroup.get('end_time').setErrors(null);
      }
      currentGroup.get('start_time').markAsTouched();
      prevGroup.get('end_time').markAsTouched();
    }
  }

  endTimeValidation(nextGroup: FormGroup, currentGroup: FormGroup, startTimestampFormatted: TimeFormat, endTimestampFormatted: TimeFormat): void {
    if (calculateSeconds(startTimestampFormatted) > calculateSeconds(endTimestampFormatted)) {
      currentGroup.get('end_time').setErrors({higherStartTime:true});
    } else {
      currentGroup.get('end_time').setErrors(null);
    }

    if (nextGroup) {
      const nextStartTimestampFormatted = parseTimestamp(nextGroup?.get('start_time')?.value);
      if (calculateSeconds(nextStartTimestampFormatted) < calculateSeconds(endTimestampFormatted)) {
        nextGroup.get('start_time').setErrors({higherPrevEndTime:true});
      } else {
        nextGroup.get('start_time').setErrors(null);
      }
      currentGroup.get('end_time').markAsTouched();
      nextGroup.get('start_time').markAsTouched();
    }
  }

  // Helper function to convert time format (mm:ss.SSS) to seconds
  getSecondsFromTime(time: string): number {
    const [minutes, seconds] = time.split(':').map(parseFloat);
    return minutes * 60 + seconds;
  }

  openDialogToTranslateSubtitles(): void {
    this.dialog.open(TranslateSubsDialogComponent, {'width': '600px', data: this.currentLanguage$}).afterClosed()
      .subscribe({
        next: receivedData => {
          if (receivedData) {
            this.translateAllSubtitles(receivedData)
          }
        }
      });
  }

  translateAllSubtitles(lang: any){
    let translationObject: GoogleTranslateRequestObject = {
      q: [],
      target: lang
    };

    let controllersToChange = {
      controlsName : []
    };

    Object.keys(this.form.controls).forEach(control=> {
      const controlValue = this.form.get(control).get('subtitles').value;
      if (controlValue) {
        translationObject.q.push(controlValue)
        controllersToChange.controlsName.push(control)
      }
    });

    if (translationObject.q) {
      this.google.translate(translationObject).subscribe((response: GoogleTranslateResponse) => {
        this._translatedText$.next(response);
        let translationArray: GoogleTranslations[] = this._translatedText$.value.data['translations'];

        if (translationArray) {
          for (let i = 0; i < controllersToChange.controlsName.length; i++) {
            const control = this.form.get(controllersToChange.controlsName[i]).get('subtitles');
            control.setValue(translationArray[i].translatedText);
          }
        }
      });
      this.formStatusChange.emit(true)
      this.isDirty = true;
      this.snackbar.open('Subtitles translated successfully', 'OK', {duration:3500});
    }
  }

  translateSingleSubtitle(targetLanguage: {lang: string, id: number}): void {
    let translationObject: GoogleTranslateRequestObject = {
      q: [this.form.get(targetLanguage.id + '-dialogBox').get('subtitles').value],
      target: targetLanguage.lang
    };

    this.google.translate(translationObject).subscribe((response: ResponseObject) => {
      if (response) {
        this.form.get(targetLanguage.id + '-dialogBox').get('subtitles').setValue(response.data.translations[0].translatedText);
        this.formStatusChange.emit(true);
        this.isDirty = true;
      }
    })

  }

  chatGPTEventDispatcher(GPTaction: ChatGPTACtion) {
    this.openai.getDataFromOpenAI(GPTaction).subscribe(res => {
      if (res) {
        this.dialog.open(ConfirmationModalComponent, {'width': '700px', data: {
          current_text: this.form.get(GPTaction.dialogId + '-dialogBox').get('subtitles').value,
          new_text: res
        }}).afterClosed().pipe(take(1)).subscribe(confirmation => {
          if (confirmation) this.form.get(GPTaction.dialogId + '-dialogBox').get('subtitles').setValue(res);
        })
      }
    })
  }

  getSupportedLanguages(): void {
    this.google.getSupportedLanguages()
    .pipe(tap(() => {
    }))
    .subscribe((response: SupportedLanguages) => {
      this._supportedLanguages$.next(response);
    });
  }

  openPersonCreationModal(): void {
    this.dialog.open(PersonCreationDialogComponent, {'width': '600px', data: this.characters}).afterClosed()
    .subscribe({
      next: receivedData => {
        if (receivedData) {
          this.newCharacters = receivedData;
          this.saveCharacters();
          this.characters = [...this.newCharacters]
          this.formStatusChange.emit(true);
          this.isDirty = true
        }
      }
    });
  }

  saveCharacters(){
    //first clear the old data
    if(this.charService.deleteCharacter(this.uid, this.videoId, this.isoCode, this.subtitleName, this.characters)){
      //then save the new data
      if(this.charService.saveCharacters(this.uid, this.videoId, this.isoCode, this.subtitleName, this.newCharacters)){
        this.snackbar.open('Your characters have been saved!', 'OK', {duration:3500});
      }else{
        this.snackbar.open('There was a problem saving your characters', 'OK', {duration:3500});
      }
    }else{
      this.snackbar.open('There was a problem saving your characters', 'OK', {duration:3500});
    }
  }

  uploadSubtitle(): void {
    this.subtitleUploadEmitter.emit(this.createSubtitleBlob(this.subtitleName.split('.')[1]));
    this.isDirty = false
  }

  createSubtitleBlob(type: string): Blob {
    let subtitleContent = ''
    Object.keys(this.form.controls).forEach((control) => {
      const currentGroup = this.form.get(control);
      subtitleContent += `${'00:'+ currentGroup.get('start_time').value},${'00:' + currentGroup.get('end_time').value}\n${currentGroup.get('subtitles').value}\n\n`;
    });
    return new Blob([subtitleContent], {type: 'text/'+ type +';charset=utf8'});
  }

  openDownloadDialog(): void {
    this.dialog.open(DownloadOptionsDialogComponent, {'width': '500px', data: this.subtitleName}).afterClosed()
      .subscribe({
        next: receivedData => {
          if(receivedData){
            switch (receivedData){
              case('srt'):
                this.handleFileDownload('.srt');
                break;
              case('sbv'):
                this.handleFileDownload('.sbv');
                break;
              case('both'):
                this.handleMultipleFilesDownload()
                break;
            }
          }
        },
        error: err => {
          console.error('Error: ' + err.message)
        }
      })
  }

  handleMultipleFilesDownload() {
    let fileBlobs: Blob[] = []
    let fileNames: string[] = []

    fileBlobs.push(this.createSubtitleBlob('srt'))
    fileBlobs.push(this.createSubtitleBlob('sbv'))
    fileNames.push(this.subtitleName.split('.')[1] + '.srt')
    fileNames.push(this.subtitleName.split('.')[1] + '.sbv')

    this.downService.downloadSubtitleFiles(fileBlobs, fileNames);
  }

  handleFileDownload(type: string){
    let subtitle = this.subtitleName.split(".")[0]

    const blob = this.createSubtitleBlob(type.split('.')[1]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    document.body.appendChild(a);
    a.download = subtitle + type
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  handleFileUpload(event: any): void {
    let fileContent = event.data.value as string;
    let cleanArray: ImportModel[] = [];
    let length = 0;
    let totalDialogs = 0;
    let sameLangNo = 0;
    let percentage: number;

    switch (event.format) {
      case ('sbv'):
        cleanArray = this.fileService.cleanMultilineString(fileContent);
        break;
      case ('srt'):
        cleanArray = this.fileService.cleanMultilineString(fileContent);
        break;
      case ('txt'):
        cleanArray = this.fileService.youtubeTranscriptParse(fileContent);
        break;
      default:
        this.snackbar.open('Format not supported!','DISMISS', {duration:5000});
    }

    if (cleanArray.length) {
      // clear all controls, to rebuild form
      Object.keys(this.form.controls).forEach(control=> {
        this.form.removeControl(control);
      });

      this.dialogBoxes = [];
      this.dialogBoxId = 0;

      length = cleanArray.length

      for (let individualSub of cleanArray) {
        this.addDialogBox(individualSub, false);
        if(individualSub.subtitleText.length > 0){
          this.google.detectLanguage(individualSub.subtitleText).subscribe({
            next: data => {
              if(data){(data.data.detections[0]["0"].language === this.isoCode) ? sameLangNo += 1 : sameLangNo += 0}
            },error: err => {
              console.error(err)
            },complete: () => {
              totalDialogs += 1
              if(totalDialogs == length){
                percentage = sameLangNo/totalDialogs * 100
                this.checkIfSubIsDifferentLang(percentage)
              }
            }
          })
        }else{
          length -= 1
        }
      }
    }
  }

  checkIfSubIsDifferentLang(percentage: number){
    if(percentage < 50){
      this.dialog.open(DetectLanguageDialogComponent, {'width': '500px', data: this.currentLanguage$}).afterClosed()
        .subscribe({
          next: receivedData => {
            if(receivedData){
              this.translateAllSubtitles(receivedData)
            }
          }
        })
    }
  }

  checkIfChangesToGenerateSpeech(): void {
    if(this.isDirty){
      this.dialog.open(GenerateVoiceDialogComponent,{width:'500px'}).afterClosed().subscribe((res: boolean)=> {
        if (res) {
          this.generateSpeechInit()
        }
      });
    }else{
      this.generateSpeechInit()
    }
  }

  generateSpeechInit(){
    let contentToSpeech: TextContentToSSML[] = [];
    Object.keys(this.form.controls).forEach(control => {
      const startTime = parseTimestamp(this.form.get(control).get('start_time').value)
      const endTime = parseTimestamp(this.form.get(control).get('end_time').value)

      const controlContent: TextContentToSSML = {
        text: this.form.get(control).get('subtitles').value,
        totalDuration: Math.floor((calculateSeconds(endTime) - calculateSeconds(startTime)) * 1000) + 'ms',
        start_time: this.form.get(control).get('start_time').value,
        end_time: this.form.get(control).get('end_time').value
      };
      contentToSpeech.push(controlContent);
    });
    this.ttsService.set_initContentSSML(contentToSpeech);
    this.navigateTTS.emit();
  }
}

export interface UploadSubtitle {
  content: Blob;
  file_name: string
}

export function timePatternValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const pattern = /^\d{2}:\d{2}\.\d{3}$/;
    const valid = pattern.test(control.value);

    return valid ? null : { invalidTimeFormat: true };
  };
}
