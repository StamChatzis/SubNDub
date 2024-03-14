import { Pipe, PipeTransform } from '@angular/core';
import { filter } from 'rxjs';

@Pipe({ name: 'filter' })
export class FilterPipe implements PipeTransform {
  /**
   * Pipe filters the list of elements based on the search text provided
   *
   * @param items list of elements to search in
   * @param searchText search string
   * @param field modular field
   * @returns list of elements filtered by search text or []
   */
  transform(items: any[], searchText: string, filterField?: string): any[] {
    if (!items) {
      return [];
    }
    if (!searchText) {
      return items;
    }

    searchText = searchText.toString().toLowerCase();
    return items.filter(items => {
      return items.snippet.title.toLowerCase().includes(searchText);
    });
  }
}