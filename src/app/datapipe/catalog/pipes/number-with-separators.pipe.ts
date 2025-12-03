import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'numberWithSeparators',
  standalone: true
})
export class NumberWithSeparatorsPipe implements PipeTransform {

  transform(num: number): string {
    return formatNumberWithSeparators(num)
  }

}

export function formatNumberWithSeparators(num: number): string {
  if (num === null || num === undefined) return '';
  return num.toLocaleString('en-US');
}
