import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sharedfilter'
})
export class SearchSharedfilterPipe implements PipeTransform {

  transform(items: any[], searchText: string, objectKey: string | null = null): any[] {
    if (!items || !searchText) {
        return items;
    }

    const normalizedSearchText = searchText.toLowerCase();

    if (objectKey) {
        return items.filter((item) => {
            return item[objectKey] && item[objectKey].toLowerCase().includes(normalizedSearchText);
        });
    } else {
        return items.filter((item) => {
            return item.title && item.title.toLowerCase().includes(normalizedSearchText);
        });
    }
  }

}
