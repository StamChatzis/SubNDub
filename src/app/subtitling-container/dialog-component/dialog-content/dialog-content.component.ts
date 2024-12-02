import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {CharacterAssign} from 'src/app/models/general/person-assign.model';
import {Language} from 'src/app/models/google/google-supported-languages';
import {YoutubeService} from 'src/app/services/youtube.service';
import {calculateSeconds, parseTimestamp} from 'src/app/shared/functions/shared-functions';
import {BehaviorSubject, Observable} from "rxjs";
import {
  TranslateSubsDialogComponent
} from "../../../components/dialog-modal/translate-subs-dialog/translate-subs-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import { CommentDialogComponent } from 'src/app/components/dialog-modal/comment-dialog/comment-dialog.component';

@Component({
  selector: 'dialog-content',
  templateUrl: './dialog-content.component.html',
  styleUrls: ['./dialog-content.component.css']
})
export class DialogContentComponent implements OnChanges {
  @Input() dialogGroup: FormGroup;
  @Input() index: number;
  @Input() dialogId: number;
  @Input() persons: CharacterAssign[];
  @Input() supportedLanguages: Language[];
  @Input() hasFocus: boolean;
  @Input() canOnlyView: boolean;
  @Input() canComment: boolean;
  @Input() currentLanguage$: Observable<Language>
  @Output() loading$: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() deleteDialogBoxEvent: EventEmitter<number> = new EventEmitter();
  @Output() dialogEmitter: EventEmitter<TimeEmitterObject> = new EventEmitter();
  @Output() translateSubtitle: EventEmitter<{lang: string, id: number}> = new EventEmitter();
  @Output() chatGPTEventEmitter: EventEmitter<ChatGPTACtion> = new EventEmitter();
  @Output() isDirty: EventEmitter<boolean> = new EventEmitter()
  @ViewChild("cardElement") cardElement: ElementRef;
  @ViewChild('translateMenu') translateMenu;
  @ViewChild('assingPersonMenu') assignPersonMenu;
  @ViewChild('openAIMenu') openAIMenu;
  @ViewChild('textarea') textarea: ElementRef;

  assignedPerson: CharacterAssign;
  wordCount: number = 0;
  characterCount: number = 0;
  timingEstimation: number = 0;
  estimationTooltip: string;
  estimationIcon: string;


  readonly openAIMenuMap = new Map([
    ['translate','Translate this sentence'],
    ['sad','Give this sentence a sadder tone'],
    ['joyful','Give this sentence a joyful tone'],
    ['shorter','Make this sentence shorter'],
    ['longer','Make this sentence longer']
  ])

  constructor(private youtube: YoutubeService,
              public dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.loading$.emit(true);
    if (changes?.hasFocus?.currentValue === true) {
      this.cardElement?.nativeElement?.scrollIntoView({behavior: 'smooth', block: 'center'})
    }
    this.wordCounter();
    this.characterCounter();
    this.subtitlingTimingEstimation()
    this.loading$.emit(false);
  }

  openCommentDialog(): void {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '440px', height:'250px'
    });
  
    dialogRef.afterClosed().subscribe(comment => {
      if (comment) {
        const newComment = `//${comment}//`;
        const control = this.getDialogControl('subtitles');
        control.setValue(`${newComment}\n${control.value}`);
      }
    });
  }  

  deleteComment(): void{
    const control = this.getDialogControl('subtitles');
    control.setValue(control.value.replace(/\/\/.*?\/\//gs, '').trim());
  }

  getDialogControl(control: string): FormControl {
    return this.dialogGroup.get(control) as FormControl
  }

  deleteDialogBox(dialogId: number): void {
    this.deleteDialogBoxEvent.emit(dialogId);
    this.isDirty.emit(true)
  }

  emitDialogId(originControl: string): void {
    const EmitObject: TimeEmitterObject = {
      id: this.dialogId,
      control: originControl
    }
    this.dialogEmitter.emit(EmitObject);
  }

  assignPerson(person: CharacterAssign): void {
    this.assignedPerson = person;
    this.isDirty.emit(true)
  }

  removePerson(){
    this.assignedPerson = null;
  }

  translateSub(): void {
    this.dialog.open(TranslateSubsDialogComponent, {'width': '600px', data: this.currentLanguage$}).afterClosed()
      .subscribe({
        next: receivedData => {
          if (receivedData) {
            this.translateSubtitle.emit({lang: receivedData, id: this.dialogId });
          }
        }
      });
  }

  chatGPTevent(action: string): void {
    const gptAction: ChatGPTACtion = {
      dialogId: this.dialogId,
      text: this.dialogGroup.get('subtitles').value,
      action: action
    }
    if (gptAction.text) this.chatGPTEventEmitter.emit(gptAction);
  }

  seekToPlayer(value: string): void {
    this.youtube.seekToPoint(calculateSeconds(parseTimestamp(value)));
  }

  wordCounter(): void {
    const regex: RegExp = /\s+/;
    this.wordCount = (this.dialogGroup.get('subtitles').value) ? this.dialogGroup.get('subtitles').value
    ?.split(regex).filter((word: string) => word.length > 0 )?.length : 0;
  }

  characterCounter(): void {
    const regex: RegExp = /\S/g;
    this.characterCount = this.dialogGroup.get('subtitles').value.split(regex).length - 1
  }

  subtitlingTimingEstimation(): void {
    // Average reading speed for an adult is around 200-300 words per minute
    // Let's take 250 as an average
    const averageWordsPerMinute = 250;

    // Convert averageWordsPerMinute to average milliseconds per word
    const averageMsPerWord = (1 / averageWordsPerMinute) * 60 * 1000;

    // Estimate the time needed to read the given number of words
    const estimatedTimeInMsForWords = this.wordCount * averageMsPerWord;

    // Assuming that it takes approximately 60 ms to read a character
    const averageMsPerCharacter = 60;
    const estimatedTimeInMsForCharacters = this.characterCount * averageMsPerCharacter;

    // Combine word and character estimations
    this.timingEstimation = estimatedTimeInMsForWords + estimatedTimeInMsForCharacters
    this.subtitleValidityEstimation();
  }

  subtitleValidityEstimation(): void {
    const startTime = parseTimestamp(this.getDialogControl('start_time').value);
    const endTime = parseTimestamp(this.getDialogControl('end_time').value);

    const timeRangeMs = Math.round((calculateSeconds(endTime) - calculateSeconds(startTime)) * 1000);
    const remainingTime = timeRangeMs - this.timingEstimation;

    if (remainingTime < 0) {
      this.estimationTooltip = "Based on the average reading speed of an adult, this subtitle length is too long for it's set Time range: " + timeRangeMs + 'ms';
      this.estimationIcon = 'report'
    }  else {
      this.estimationTooltip = "Based on the average reading speed of an adult, this subtitle length is VALID for it's set Time range: " + timeRangeMs + 'ms';
      this.estimationIcon = "done";
    }
  }
}

export interface TimeEmitterObject {
  id: number;
  control: string;
}

export interface ChatGPTACtion {
  dialogId: number;
  text: string;
  action: string
}
