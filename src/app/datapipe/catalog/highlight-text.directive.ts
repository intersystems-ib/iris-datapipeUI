import {Directive, ElementRef, inject, Input, Renderer2} from '@angular/core';
import {DomSanitizer} from "@angular/platform-browser";

@Directive({
  selector: '[HighlightSearchText]',
  standalone: true
})
export class HighlightSearchTextDirective {

  private sanitizer = inject(DomSanitizer)
  private renderer = inject(Renderer2)
  private el = inject(ElementRef)

  @Input()
  style: string | undefined = "padding:0"

  @Input()
  set searchString(searchString: string | undefined | null) {
    const escaped = this.escapeHtml(this.el.nativeElement.innerHTML)
    let safeHtml;
    if (searchString) {
      safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.highlightTerms(searchString, escaped));
    } else {
      safeHtml = this.sanitizer.bypassSecurityTrustHtml(escaped);
    }
    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', safeHtml);
  }

  escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  highlightTerms(searchTerm: string, ...text: string[]): string {
    const joinedText = text.join(" ")
    if (joinedText.trim() == "") {
      return '';
    }
    return joinedText.replace(getSearchRegex(searchTerm), '<mark ' + (this.style ? ' style="' + this.style + '"' : '') + '>$1</mark>');
  }

}

export function getSearchRegex(searchTerm: string) {
  const escaped = searchTerm.trim().split(/\s+/).filter(t => t.length > 0)
    .map(te => te.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
  return new RegExp(`(${escaped})`, 'gi');
}
