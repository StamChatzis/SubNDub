import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'import-button',
  templateUrl: './import-button.component.html',
  styleUrls: ['./import-button.component.css']
})
export class ImportButtonComponent {

  public fileContent$ = new BehaviorSubject<string>(null);
  @Input() acceptedFiles: string;
  @Output() isFormDirty: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() fileContentEmit: EventEmitter<any> = new EventEmitter<any>();

  selectFile(event: Event): void {
    let file = (event.target as HTMLInputElement).files[0];
    this.readFile(file)
    .then((data: string | ArrayBuffer) => {
      this.fileContent$.next(data as string);
      this.fileContentEmit.emit({data: this.fileContent$, format: file.name.split('.')[1]});
    });
  }

  private async readFile(file: File): Promise<string | ArrayBuffer> {
    return new Promise<string | ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.fileContent$.next(<string>reader.result);
        this.isFormDirty.emit(true);
        return resolve((e.target as FileReader).result);
      };

      reader.onerror = () => {
        console.error(`FileReader failed on file ${file.name}.`);
        return reject(null);
      };

      if (!file) {
        console.error('No file to read.');
        return reject(null);
      }

      reader.readAsText(file);
    });
  }
}
