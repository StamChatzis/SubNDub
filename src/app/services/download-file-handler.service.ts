import { Injectable } from '@angular/core';
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { saveAs } from "file-saver";
import { HttpClient } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import * as JSZip from "jszip";
import {CharacterAssign} from "../models/general/person-assign.model";

@Injectable({
  providedIn: 'root'
})
export class DownloadFileHandlerService {
  constructor(private storage: AngularFireStorage,
              private http: HttpClient,
              private snackbar: MatSnackBar) {}

  downloadSubtitleFiles(fileBlobs: Blob[], subtitleName: string[]){
    const zip = new JSZip();

    fileBlobs.forEach((blob, index) => {
      zip.file(subtitleName[index], blob);
    });

    zip.generateAsync({type: "blob"})
      .then(c => {
        saveAs(c, 'subtitles.zip');
      })
      .catch(err => {
        this.snackbar.open('There was a problem downloading the subtitle files', 'DISMISS', {duration: 5000});
        console.error('Error downloading subtitle files: ' + err.message())
      });
  }

  massExportSubtitles(data: any[], videoId: any, uid: any){
    const zip = new JSZip();
    let fileNames: string[] = [];
    let fileBlobs: Blob[] = [];

    const downloadPromises = data.map((item, index) => {
      return new Promise<void>((resolve, reject) => {
        const fileName = item.fullFileName;
        const storageRef = this.storage.ref(`subtitles/${uid}/${videoId}/${item.iso}/${fileName}`);
        fileNames.push(fileName.split('.')[0] + '[' + item.iso + ']' + '.' + fileName.split('.')[1]);

        storageRef.getDownloadURL().subscribe({
          next: url => {
            this.http.get(url, { responseType: 'text' }).subscribe({
              next: sub => {
                const fileBlob = new Blob([sub], { type: 'text/' + fileName.split('.').pop() + ';charset=utf8' });
                fileBlobs.push(fileBlob);
                resolve();
              },
              error: err => {
                this.snackbar.open('There was a problem downloading the subtitle files', 'DISMISS', {duration: 5000});
                reject(err)
              }
            });
          },
          error: err => {
            this.snackbar.open('There was a problem downloading the subtitle files', 'DISMISS', {duration: 5000});
            reject(err)
          }
        });
      });
    });

    Promise.all(downloadPromises)
      .then(() => {
        fileBlobs.forEach((blob, index) => {
          zip.file(fileNames[index], blob);
        });

        zip.generateAsync({ type: 'blob' }).then(content => {
          const a = document.createElement('a');
          const url = URL.createObjectURL(content);
          a.href = url;
          a.download = `subtitles.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.snackbar.open('Subtitles downloaded successfully', 'OK', {duration: 5000});
        });
      })
      .catch(err => {
        this.snackbar.open('There was a problem downloading the subtitle files', 'DISMISS', {duration: 5000});
        console.error('Error downloading files:', err);
      });
  }

  exportAllActors(actors: CharacterAssign[]){
    const actorsJson = JSON.stringify({ actors: actors }, null, 2);
    const blob = new Blob([actorsJson], { type: 'application/json' });
    saveAs(blob, 'actors.json');
  }
}
