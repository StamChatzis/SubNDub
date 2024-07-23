import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'sub-timeline',
  templateUrl: './sub-timeline.component.html',
  styleUrls: ['./sub-timeline.component.css']
})

export class SubTimelineComponent implements OnChanges {
  @Input() videoDurationISO: BehaviorSubject<string>;
  durationToSeconds: number;
  timelinePoints: string[];

  ngOnChanges(changes?: SimpleChanges): void {
    const value = changes['videoDurationISO'].currentValue;
    if (value) {
      //parse YouTube duration format like -> PT5M13S, to seconds
      let match = value.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

      match = match.slice(1).map(x => {
        if (x != null) {
            return x.replace(/\D/, '');
        }
      });

      const hours = (parseInt(match[0]) || 0);
      const minutes = (parseInt(match[1]) || 0);
      const seconds = (parseInt(match[2]) || 0);

      this.durationToSeconds = hours * 3600 + minutes * 60 + seconds;
      const interval = 3; // 3-second periods
      this.timelinePoints = this.generateTimeArray(this.durationToSeconds, interval);
    }
  }

  generateTimeArray(totalSeconds: number, interval: number) {
    let timeArray: string[] = [];
    for (let i = 0; i <= totalSeconds; i += interval) {
        timeArray.push(this.formatTime(i));
    }
    return timeArray;
  }

  formatTime(seconds: number) {
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = (seconds % 1).toFixed(3).substring(2);

    return (minutes < 10 ? "0" : "") + minutes + ":" +
        (remainingSeconds < 10 ? "0" : "") + remainingSeconds + "." +
        (milliseconds.length < 3 ? "0" : "") + milliseconds;
  }

}
