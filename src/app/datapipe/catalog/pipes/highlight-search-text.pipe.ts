import {inject, Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Pipe({
  name: 'highlightText',
  standalone: true
})
export class HighlightSearchTextPipe implements PipeTransform {

  private sanitizer = inject(DomSanitizer);

  transform(searchTerm: string, ...text:string[]): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(highlightTerms(searchTerm, ...text))
  }

}

export function highlightTerms(searchTerm: string, ...text:string[]): string{
  const joinedText = text.join(" ")
  if (joinedText.trim()=="") {
    return '';
  }
  return joinedText.replace(getSearchRegex(searchTerm), '<mark style="padding:0">$1</mark>');
}

export function getSearchRegex(searchTerm: string) {
  const escaped = searchTerm.trim().split(/\s+/).filter(t => t.length > 0)
    .map(te => te.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
  return new RegExp(`(${escaped})`, 'gi');
}
