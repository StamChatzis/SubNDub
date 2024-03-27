import { Injectable } from '@angular/core';
import { openAIConfig } from 'src/environments/environment';
import { ChatGPTACtion } from '../subtitling-container/dialog-component/dialog-content/dialog-content.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {

  constructor(private http: HttpClient) { }

  // readonly openai = new OpenAI({apiKey: openAIConfig.apiKey, dangerouslyAllowBrowser : true});

  readonly promptMap = new Map([
    ['sad', 'Adjust the tone of the following sentence to make it sadder.'],
    ['joyful', 'Transform the following sentence to make it more joyful.'],
    ['shorter', 'Condense the following sentence while preserving its original meaning.'],
    ['longer', 'Enlarge the following sentence without changing its original meaning.']
  ]);

   getDataFromOpenAI(GPTaction: ChatGPTACtion): Observable<any> {
    const url = "https://api.openai.com/v1/chat/completions";
    const  httpHeaders = new HttpHeaders().set("Authorization",`Bearer ${openAIConfig.OPENAI_API_KEY}`);

    let payload = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: this.promptMap.get(GPTaction.action) + GPTaction.text }],
    }

    return this.http.post(url, payload, {headers: httpHeaders} ).pipe(
      map((res: any) => {
        return res.choices[0].message.content
      })
    );
  }
}
