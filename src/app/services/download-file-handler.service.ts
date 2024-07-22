import { Injectable } from '@angular/core';
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { lastValueFrom } from "rxjs";
import * as JSZip from "jszip";

@Injectable({
  providedIn: 'root'
})
export class DownloadFileHandlerService {

  constructor(private storage: AngularFireStorage) {}

  async getLanguages(videoId: string, userId: string) {
    // const ref = this.storage.ref(`subtitles/${userId}/${videoId}`);
    // const allLang$ = ref.listAll()
    // const result_1 = await lastValueFrom(allLang$);
    // return result_1.items.map(item => item.name);
  }

  async downloadSubtitleFile(videoId: string, userId: string, languageIsoCode: string) {
    // const ref = this.storage.ref(`subtitles/${userId}/${videoId}/${languageIsoCode}`);
    // const url = ref.getDownloadURL();
    // const result_1 = await lastValueFrom(url);
    // const response = await fetch(result_1);
    // return await response.blob();
  }

  massExportSubtitles(videoId: string, userId: string) {
    // const languages = await this.getLanguages(videoId, userId);
    // const zip = new JSZip();
    // const promises = languages.map(async language => {
    //   const blob = await this.downloadSubtitleFile(videoId, userId, language);
    //   return await new Promise<void>(resolve => {
    //     const reader = new FileReader();
    //     reader.onload = () => {
    //       const fileContent = reader.result as string;
    //       zip.file(`${videoId}_${language}.srt`, fileContent);
    //       resolve();
    //     };
    //     reader.readAsText(blob);
    //   });
    // });
    // await Promise.all(promises);
    // const blob_2 = await zip.generateAsync({type: 'blob'});
    // const url = window.URL.createObjectURL(blob_2);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `${videoId}_subtitles.zip`;
    // a.click();
    // window.URL.revokeObjectURL(url);
  }

}

  // async downloadAllSubtitles(userId: any, videoId: any) {
  //   const storageRef = this.storage.ref(`subtitles/${userId}/${videoId}`);
  //   const zipData = [];
  //
  //   const languageFolders = await storageRef.listAll().forEach(result => languageFolders.add(result))
  //   const zip = new JSZip();
  //
  //   for (const languageFolder of languageFolders) {
  //     const languageDir = languageFolder.fullPath.split('/').pop();  // Get language code
  //     const languageRef = storageRef.child(languageDir);
  //
  //     // Get all subtitle files within the language folder
  //     const subtitleFiles = await languageRef.listAll().forEach(result => subtitleFiles.add(result));
  //
  //     // Loop through each subtitle file
  //     for (const subtitleFile of subtitleFiles) {
  //       const subtitleName = subtitleFile.name;
  //       const downloadUrl = await subtitleFile.getDownloadURL();
  //
  //       // Fetch subtitle content
  //       const subtitleContent = await fetch(downloadUrl).then(response => response.text()); // Fetch as text
  //
  //       // Encode content and add to zipData
  //       const encodedContent = btoa(subtitleContent);  // Base64 encode text data
  //       zipData.push(`data:text/plain;base64,${encodedContent}`);
  //     }
  //   }

    // Create a ZIP file URL using a Blob
   // const zipBlob = new Blob(zipData, { type: 'application/zip' });
    //const zipUrl = URL.createObjectURL(zipBlob);

    // const subtitlesRef = ref(this.storage, folderPath);

    // try {
      // List all subtitles in the folder
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
//   }




//----------------------------------------------------------------------------------------
//A great way to go back to where you were with the click o button
//Do not delete me please :(
//
// private history: string[] = []; //for navigation example
//
// constructor(private router: Router) {
//   this.router.events
//     .pipe(filter(event => event instanceof NavigationEnd))
//     .subscribe((event: NavigationEnd) => {
//       this.history.push(event.urlAfterRedirects);
//     });
//  }
//
// public getHistory(): string[] {
//   return this.history;
// }
//
// public goBack(): void {
//   this.history.pop(); // Remove current url
//   if (this.history.length > 0) {
//     this.router.navigateByUrl(this.history.pop()!);
//   } else {
//     this.router.navigate(['/']); // Navigate to default route if history is empty
//   }
// }
