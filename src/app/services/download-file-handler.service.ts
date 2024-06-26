import { Injectable } from '@angular/core';
import { AngularFireStorage } from "@angular/fire/compat/storage";
import * as JSZip from "jszip";

@Injectable({
  providedIn: 'root'
})
export class DownloadFileHandlerService {

  constructor(private storage: AngularFireStorage) {}

  downloadAllSubtitles(userId: string, videoId: string) {
    const storagePath = `subtitles/${userId}/${videoId}/`;
    const ref = this.storage.ref(storagePath);

    ref.listAll().subscribe(result => {
      const subtitles = result.items;
      const zip = new JSZip();

      subtitles.forEach(subtitle => {
        subtitle.getDownloadURL().then(url => {
          fetch(url)
            .then(response => response.blob())
            .then(blob => {
              zip.file(subtitle.name, blob);
            });
        });
      });

      zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${videoId}_subtitles.zip`;
        link.click();
      });
    });
  }
}
