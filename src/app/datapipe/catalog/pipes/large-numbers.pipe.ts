import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'largeNumbers',
  standalone: true
})
export class LargeNumbersPipe implements PipeTransform {

  transform(num: number): string {
    if (num === undefined ) return ''
    if (num === null ) return ''
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return num.toString();
    }
  }

}
