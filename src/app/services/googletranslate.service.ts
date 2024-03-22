import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GoogleTranslateRequestObject } from 'src/app/models/google/google-translate-request';
import { environment } from 'src/environments/environment';

@Injectable()
export class GoogleTranslateService {
  constructor(private http: HttpClient) { }

  translate(translationObject: GoogleTranslateRequestObject) {
    const url = 'https://translation.googleapis.com/language/translate/v2?key=';
    const key = environment.GOOGLE_API_KEY;
    return this.http.post(url + key, translationObject);
  }

  getSupportedLanguages() {
    const url = `https://translation.googleapis.com/language/translate/v2/languages?target=en&key=${environment.GOOGLE_API_KEY}`;
    return this.http.get(url);
  }

}

