import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CharacterAssign } from 'src/app/models/general/person-assign.model';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {DownloadFileHandlerService} from "../../../../services/download-file-handler.service";
import {UploadFileHandlerService} from "../../../../services/upload-file-handler.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-person-creation-dialog',
  templateUrl: './person-creation-dialog.component.html',
  styleUrls: ['./person-creation-dialog.component.css'],
})
export class PersonCreationDialogComponent {
  private readonly defaultColor = '#2889e9';
  acceptedFiles = '.json'
  characters: CharacterAssign[] = [];
  private backUpPersons: CharacterAssign[] = [];
  color: string = this.defaultColor;
  personForm: FormGroup;
  isDirty: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) private data: CharacterAssign[],
              private downloadHandler: DownloadFileHandlerService,
              private uploadHandler: UploadFileHandlerService,
              private snackbar: MatSnackBar) {
    if(this.data) {
      for(let data of this.data){
        const char ={
          name: data['name'],
          color: data['color'],
        }
        this.characters.push(char)
        this.backUpPersons.push(char)
      }
    } else {
      this.characters = [];
    }

    this.personForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ0-9\s]*$/)])
    })
   }

  addPerson(): void {
    if (this.personForm.value.name) {
      const Person: CharacterAssign = {
        name: this.personForm.value.name,
        color : this.color
      }

      this.characters.push(Person);

      //reset fields
      this.personForm.controls['name'].setValue('');
      this.color = this.defaultColor;
      this.personForm.reset()
      this.isDirty = true
    }
  }

  getNameError(){
    if(this.personForm.get('name')?.hasError('required')) {
      return `This field is required`;
    }else if(this.personForm.get('name')?.hasError('pattern')){
      return `Field's format is not supported`
    }
  }

  onType(){
    this.isDirty = true
  }

  exportActors(){
    if(this.characters.length > 0){
      this.downloadHandler.exportAllActors(this.characters);
    }else {
      this.snackbar.open('You have not created any actors yet', 'OK', {duration:3000});
    }
  }

  importActors(event: Event){
    let file = (event.target as HTMLInputElement).files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = (e.target as FileReader).result as string;
        if(file.name.split('.')[1] === 'json'){
          this.characters = this.uploadHandler.importActorsFromFile(fileContent);
          this.isDirty = true
        }else{
          this.snackbar.open('This file is not supported', 'OK', {duration:3000});
        }
      };
      reader.readAsText(file);
    }
  }

  deletePerson(index: number): void {
    this.characters.splice(index,1);
    this.isDirty = true
  }

  resetCharacters(){
    this.characters = [...this.backUpPersons]
  }
}
