import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'communityfilter'
})
export class SearchCommunityfilterPipe implements PipeTransform {

  transform(videos: any[], filterValue: string, selectedFilter: string, sortByDate: boolean = false, sortOrder: 'asc' | 'desc' = 'asc'): any[] {
    if (!videos || !selectedFilter) {
      return videos; 
    }

    if (!filterValue) {
      return sortByDate ? this.sortByDate(videos, sortOrder) : videos;
    }

    const lowerCaseFilterValue = filterValue.toLowerCase();

    const filteredVideos = videos.filter(video => {
      switch (selectedFilter) {
        case 'title':
          return video.title.toLowerCase().includes(lowerCaseFilterValue);
        case 'language':
          return video.language.toLowerCase().includes(lowerCaseFilterValue);
        case 'requestedBy':
          return video.requestedBy.toLowerCase().includes(lowerCaseFilterValue);
        default:
          return true;
      }
    });

    const result = filteredVideos.length > 0 ? filteredVideos : videos;

    return sortByDate ? this.sortByDate(result, sortOrder) : result;
  }

  private sortByDate(videos: any[], sortOrder: 'asc' | 'desc'): any[] {
    return videos.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA; 
    });
  }

}
