import { Injectable } from '@angular/core';
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { combineLatest, filter, Observable, switchMap } from "rxjs";
import { saveAs } from 'file-saver';
import { NavigationEnd, Router } from "@angular/router";
import * as JSZip from "jszip";
//import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class DownloadFileHandlerService {

  // private history: string[] = []; //for navigation example

  constructor(private storage: AngularFireStorage, private router: Router) {
    // this.router.events
    //   .pipe(filter(event => event instanceof NavigationEnd))
    //   .subscribe((event: NavigationEnd) => {
    //     this.history.push(event.urlAfterRedirects);
    //   });
  }

  getSubtitles(userId: string, videoId: string) {
    const path = `subtitles/${userId}/${videoId}/`;
    const ref = this.storage.ref(path);
    return ref.listAll().pipe(
      switchMap(result => {
        const fileObservables = result.items.map(item => item.getDownloadURL());
        return combineLatest(fileObservables);
      })
    );
  }

  downloadFiles(urls: string[]) {
    return Promise.all(urls.map(url => {
      return fetch(url).then(res => res.blob())
    }));
  }

  createZip(blobs: Blob[], filenames: string[]) {
    const zip = new JSZip();
    blobs.forEach((blob, index) => {
      zip.file(filenames[index], blob);
    });
    return zip.generateAsync({ type: 'blob' });
  }

  downloadSubtitles(userId: string, videoId: string) {
    this.getSubtitles(userId, videoId).pipe(
      switchMap(async urls => {
        const blobs = await this.downloadFiles(urls);
        return ({blobs, urls});
      }),
      switchMap(({ blobs, urls }) => {
        const filenames = urls.map(url => url.split('/').pop()!);
        return this.createZip(blobs, filenames);
      })
    ).subscribe({
      next: zipBlob => {
        saveAs(zipBlob, `${videoId}-subtitles.zip`);
      },
      error: err => {
        console.error('Error:', err);
      }
    });
  }

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

//A great way to go back to where you were with the click o button
//Do not delete me please :(
// public getHistory(): string[] {
//   return this.history;
// }

// public goBack(): void {
//   this.history.pop(); // Remove current url
//   if (this.history.length > 0) {
//     this.router.navigateByUrl(this.history.pop()!);
//   } else {
//     this.router.navigate(['/']); // Navigate to default route if history is empty
//   }
// }
