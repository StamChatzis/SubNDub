import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PersonAssign } from 'src/app/models/general/person-assign.model';
import { ColorPickerModule } from 'ngx-color-picker';

@Component({
  selector: 'app-person-creation-dialog',
  templateUrl: './person-creation-dialog.component.html',
  styleUrls: ['./person-creation-dialog.component.css'],
})
export class PersonCreationDialogComponent {
  @ViewChild('personName') personName: ElementRef;
  persons: PersonAssign[];
  private readonly defaultcolor = '#2889e9'; //default color
  color: string = this.defaultcolor; 
  constructor(@Inject(MAT_DIALOG_DATA) public data: PersonAssign[]) {
    if (this.data) this.persons = this.data;
    else this.persons = [];
   }

  addPerson(): void {
    if (this.personName.nativeElement.value) {
      const Person: PersonAssign = {
        name: this.personName.nativeElement.value,
        color : this.color
      }
      this.persons.push(Person);
      this.data = this.persons

      //reset fields
      this.personName.nativeElement.value = '';
      this.color = this.defaultcolor;
    }
  }

  deletePerson(index: number): void {
    this.persons.splice(index,1);
    this.data = this.persons;
  }
}
