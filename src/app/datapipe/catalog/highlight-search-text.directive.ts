import {
    Directive,
    ElementRef,
    EventEmitter,
    inject,
    Input,
    OnDestroy,
    Output,
    Renderer2,
    SecurityContext
} from '@angular/core';
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

@Directive({
    selector: '[HighlightSearchText]',
    standalone: true
})
///To use:
/*
<h2 HighlightSearchText [text]="textToDisplay" [searchString]="searchString"
                (resultChange)="searchResults = searchResults+$event"></h2>
<!--Where text ought to be the text to display, searchString must be the string to search for in the text,
can be empty or null and searchResults a numerical value with starting value 0-->
* */
export class HighlightSearchTextDirective implements OnDestroy {

    private sanitizer = inject(DomSanitizer)
    private renderer = inject(Renderer2)
    private el = inject(ElementRef)

    @Input()
    style: string | undefined = "padding:0";

    @Input()
    text: string | undefined;

    @Input()
    set searchString(searchString: string | undefined | null) {
        this.search(searchString)
    }

    search(searchString: string | undefined | null) {
        let safeHtml: string | null = '';
        if (this.text) {
            const escaped = this.escapeHtml(this.text)
            const normalized = searchString?.trim();
            if (normalized) {
                safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, this.highlightTerms(normalized, escaped));
            } else {
                if (this.results !== 0) {
                    this.emitResultChange(-this.results)
                    this.results = 0
                }
                safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, escaped);
            }
        }
        this.renderer.setProperty(this.el.nativeElement, 'innerHTML', safeHtml ? safeHtml : '');
    }

    @Output()
    results: number = 0;

    @Output()
    resultChange = new EventEmitter<number>();

    @Output()
    resultingString: SafeHtml | undefined;


    escapeHtml(text: string): string {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    highlightTerms(searchTerm: string, ...text: string[]): string {
        const joinedText = text.join(" ")
        if (joinedText.trim() == "") {
            this.emitResultChange(-this.results)
            this.results = 0
            return '';
        }
        let replacedValues = 0;
        const result = joinedText.replace(getSearchRegex(searchTerm), (sub: string) => {
            replacedValues++;
            return '<mark class="searchMark">' + sub + '</mark>';
        });
        this.emitResultChange(replacedValues - this.results)
        this.results = replacedValues
        return result
    }

    ngOnDestroy() {
        this.emitResultChange(-this.results)
    }

    private emitResultChange(delta: number) {
        if (delta === 0) return;
        Promise.resolve().then(() => this.resultChange.emit(delta));
    }

}

export function getSearchRegex(searchTerm: string) {
    const escaped = searchTerm.trim().split(/\s+/).filter(t => t.length > 0)
        .map(te => te.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
    return new RegExp(`(${escaped})`, 'gi');
}
