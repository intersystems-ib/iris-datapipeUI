import {Pipe, PipeTransform} from '@angular/core';
import {getSearchRegex} from "./highlight-search-text.pipe";

@Pipe({
  name: 'searchText',
  standalone: true
})
export class SearchTextPipe implements PipeTransform {

  transform(searchTerm: string, ...text: string[]): string[] {
    const joinedText = text.join(" ")
    if (joinedText.trim() == "") {
      return [];
    }
    const matches = joinedText.match(getSearchRegex(searchTerm))
    return matches ? matches.map(m => m) : [];
  }

}
