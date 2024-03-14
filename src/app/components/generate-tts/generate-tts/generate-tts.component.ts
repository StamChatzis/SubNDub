import { Component, OnInit } from '@angular/core';
import { TextContentToSSML } from 'src/app/models/general/gpt-feed.model';
import { TextToSpeechService } from 'src/app/services/text-to-speech-service.service';

@Component({
  selector: 'generate-tts',
  templateUrl: './generate-tts.component.html',
  styleUrls: ['./generate-tts.component.css']
})
export class GenerateTTSComponent implements OnInit {

  public textContentSSML: TextContentToSSML[];
  public SSMLContent: string = '';

  constructor(private ttsService: TextToSpeechService) { }

  ngOnInit(): void {
    this.textContentSSML = this.ttsService.get_initContentSSML();
  }

  generateSSML(): void {
    let ssml = '<speak>\n';
    
    this.textContentSSML.forEach((obj,index) => {
      ssml += `   <prosody duration="${obj.totalDuration}">${obj.text}</prosody>\n`;
      if (index < this.textContentSSML.length - 1) {
        ssml += '   <break time="100ms"/>\n'; // Adding a break between segments
      }
    });

    ssml += '</speak>';
    this.SSMLContent = ssml;
  }

}
