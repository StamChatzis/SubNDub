import { Injectable } from '@angular/core';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class DownloadFileHandlerService {

  constructor() {}

  async downloadAllSubtitles(folderPath: string) {
    // const subtitlesRef = ref(this.storage, folderPath);
    //
    // try {
    //   // List all subtitles in the folder
    //   const subtitles = await listAll(subtitlesRef);
    //
    //   // Create a zip file to store the subtitles
    //   const zip = new JSZip();
    //
    //   // Download each subtitle and add it to the zip file
    //   for (const subtitle of subtitles.items) {
    //     const downloadURL = await getDownloadURL(subtitle);
    //     const filename = subtitle.name;
    //     const content = await fetch(downloadURL).then(res => res.blob());
    //     zip.file(filename, content);
    //   }
    //
    //   // Generate the zip file and download it
    //   const content = await zip.generateAsync({ type: 'blob' });
    //   const url = window.URL.createObjectURL(content);
    //   const link = document.createElement('a');
    //   link.href = url;
    //   link.download = 'subtitles.zip';
    //   link.click();
    //   window.URL.revokeObjectURL(url);
    //
    // } catch (error) {
    //   console.error('Error downloading subtitles:', error);
    // }
  }

}
