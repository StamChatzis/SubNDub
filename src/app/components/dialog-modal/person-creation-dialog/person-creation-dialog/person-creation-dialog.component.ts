import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CharacterAssign } from 'src/app/models/general/person-assign.model';
import { ColorPickerModule } from 'ngx-color-picker';
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-person-creation-dialog',
  templateUrl: './person-creation-dialog.component.html',
  styleUrls: ['./person-creation-dialog.component.css'],
})
export class PersonCreationDialogComponent {
  private readonly defaultColor = '#2889e9';
  characters: CharacterAssign[];
  private readonly backUpPersons: CharacterAssign[];
  color: string = this.defaultColor;
  personForm: FormGroup;
  isDirty: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) private data: CharacterAssign[]) {
    if(this.data) {
      this.characters = [...this.data];
      this.backUpPersons = [...this.data];
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

  deletePerson(index: number): void {
    this.characters.splice(index,1);
    this.isDirty = true
  }

  resetCharacters(){
    this.characters = [...this.backUpPersons]
  }
}
