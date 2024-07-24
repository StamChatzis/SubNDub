import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PersonAssign } from 'src/app/models/general/person-assign.model';
import { ColorPickerModule } from 'ngx-color-picker';
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-person-creation-dialog',
  templateUrl: './person-creation-dialog.component.html',
  styleUrls: ['./person-creation-dialog.component.css'],
})
export class PersonCreationDialogComponent {
  //@ViewChild('personName') personName: ElementRef;
  private readonly defaultColor = '#2889e9'; //default color
  persons: PersonAssign[];
  color: string = this.defaultColor;
  personForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PersonAssign[]) {
    if (this.data) {
      this.persons = this.data;
    } else {
      this.persons = [];
    }

    this.personForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ0-9\s]*$/)])
    })
   }

  addPerson(): void {
    if (this.personForm.value.name) {
      const Person: PersonAssign = {
        name: this.personForm.value.name,
        color : this.color
      }
      this.persons.push(Person);
      this.data = this.persons

      //reset fields
      this.personForm.controls['name'].setValue('');
      this.color = this.defaultColor;
    }
  }

  deletePerson(index: number): void {
    this.persons.splice(index,1);
    this.data = this.persons;
  }
}
