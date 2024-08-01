import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GoogleTranslateRequestObject } from 'src/app/models/google/google-translate-request';
import { GOOGLE_API_KEY } from 'src/environments/environment';
import {GoogleDetectionResponseData} from "../models/google/google-translate-response";

@Injectable({
    providedIn: 'root'
  }
)
export class GoogleTranslateService {
  constructor(private http: HttpClient) { }

  translate(translationObject: GoogleTranslateRequestObject) {
    const url = 'https://translation.googleapis.com/language/translate/v2?key=';
    const key = GOOGLE_API_KEY;
    return this.http.post(url + key, translationObject);
  }

  getSupportedLanguages() {
    const url = `https://translation.googleapis.com/language/translate/v2/languages?target=en&key=${GOOGLE_API_KEY}`;
    return this.http.get(url);
  }

  detectLanguage(text: string){
    const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_API_KEY}`;
    const body = {
      q: text
    };
    return this.http.post<GoogleDetectionResponseData>(url, body);
  }

}

