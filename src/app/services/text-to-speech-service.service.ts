import { Injectable } from '@angular/core';
import { TextContentToSSML } from '../models/general/gpt-feed.model';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {

  private initContentSSML: TextContentToSSML[];
  private formContentGroup: FormGroup;

  set_initContentSSML(content: TextContentToSSML[]) {
    this.initContentSSML = content;
  }

  set_formContent(content: FormGroup) {
    this.formContentGroup = content;
  }

  get_initContentSSML(): TextContentToSSML[] {
    return this.initContentSSML;
  }

  get_formContent(): FormGroup {
    return this.formContentGroup
  }

  constructor() { }
}
