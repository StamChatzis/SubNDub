import { Injectable } from '@angular/core';
import { ImportModel } from 'src/app/models/general/import-sbv.model';

@Injectable()
export class UploadFileHandlerService {

  constructor() { }

  cleanMultilineString(input: string): ImportModel[] {
    const lines = input.trim().replace(/(\r|\r)/gm, '').split('\n');

    const subtitleObjects = [];
    let currentSubtitle: ImportModel = {start_time: '', end_time:'', subtitleText:''};
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const timestampRegex = /^(\d{1,2}:\d{2}:\d{2}\.\d{3}),(\d{1,2}:\d{2}:\d{2}\.\d{3})$/;

      if (line.match(timestampRegex)) {
        const [startTime, endTime] = line.split(",");
        currentSubtitle = {
          start_time: this.formatTimestamp(startTime),
          end_time: this.formatTimestamp(endTime),
          subtitleText: ""
         };
        subtitleObjects.push(currentSubtitle);
      } else if (line !== "") {
        currentSubtitle.subtitleText += line + ' ';
      }
    }

    return subtitleObjects;
  }

  youtubeTranscriptParse(input: string): ImportModel[] {
    //parses youtube transcript
    const subtitleObjects = [];
    const lines = input.trim().replace(/(\r|\r)/gm, '').split('\n');
    let currentEntry = { start_time: '', end_time: '', subtitleText: '' };

    for (const line of lines) {
      const match = line.match(/^(\d+:\d+)\s*(.*)/);

      if (match) {
        // Extract time and text
        const [, start_time, rest] = match;

        // Save previous entry if it exists
        if (currentEntry.start_time) {
          currentEntry.end_time = '0' + start_time.trim() + '.000'; // Save the end time
          subtitleObjects.push(currentEntry);
        }

        // Start a new entry
        currentEntry = { start_time: '0' + start_time + '.000', end_time: '', subtitleText: '' };
      } else {
        // Concatenate lines of text within the same entry
        currentEntry.subtitleText += line.trim() + ' ';
      }
    }

    // Add the last entry
    if (currentEntry.start_time) {
      currentEntry.end_time = (currentEntry.end_time.trim()) ? currentEntry.end_time.trim() : '0' + currentEntry.start_time + '.000'; // Save the end time
      subtitleObjects.push(currentEntry);
    }

    return subtitleObjects;
  }

  formatTimestamp(timestamp: string): string {
    const parts = timestamp.split(':');
    parts.shift()
    return parts.join(':');
  }
}
