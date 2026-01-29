import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'durationCompact',
  standalone: true
})
export class DurationCompactPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    if (totalSeconds === null || totalSeconds === undefined) return '';

    const seconds = Number(totalSeconds);
    if (Number.isNaN(seconds)) return '';

    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}min`);
    parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }
}
