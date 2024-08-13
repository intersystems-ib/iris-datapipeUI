import { Component, EventEmitter, Input, Output } from '@angular/core';
import { tap, catchError } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { NotificationService } from '../notification.service';
import { PreferencesService } from '../preferences.service';

@Component({
  selector: 'app-default-filters',
  templateUrl: './default-filters.component.html',
  styleUrl: './default-filters.component.scss'
})
export class DefaultFiltersComponent {
  pressTimeout: any;

  favorites:any[] = [];
  
  savedFilters: any;

  @Input() filters: any;
  @Input() disabledButtons: boolean = false;
  @Input() skippedFields: string[] = [];

  protected settingKey?: string;
  @Input() set SettingKey(settingKey: string | undefined) {
    if (settingKey == undefined) {
      this.notificationService.errorMessage("No default setting key defined")
    }
    this.settingKey = settingKey;
    this.init();
  }

  @Output() filtersChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() clickLoad: EventEmitter<any> = new EventEmitter<any>();
  @Output() loadingDone: EventEmitter<any> = new EventEmitter<any>();

  constructor(private authService: AuthService,
              private preferencesService: PreferencesService,
              private notificationService: NotificationService) {
  }

  init() {
    this.preferencesService.get(this.settingKey!.toUpperCase(), this.authService.username)
      .subscribe((setting: any) => {
        this.favorites = setting.Value.map((content: string, index: number) => ({
          Label: setting.ExtraProperty1[index],
          Content: content,
          showActions: false,
          isShaking: false
        }));
        let firstFavorite = {};
        if (this.favorites.length > 0) {
          firstFavorite = JSON.parse(this.favorites[0].Content);
        }
        this.loadingDone.emit(firstFavorite);
      });
  }

  handleClick(index: number) {
    if (this.favorites.some(favorite => favorite.showActions)) {
      return; // Don't throw the event if any is in edition mode
    }
    this.filters = JSON.parse(this.favorites[index].Content);
    this.clickLoad.emit(this.filters);
  }

  handleMouseDown(index: number) {
    if (this.favorites.some(favorite => favorite.showActions)) {
      return; // Don't throw the event if any is in edition mode
    }

    this.pressTimeout = setTimeout(() => {
      this.favorites[index].isShaking = true;
      this.favorites[index].showActions = true;
    }, 1000); // Time in ms to consider long click
  }

  handleMouseUp(index: number) {
    clearTimeout(this.pressTimeout);
    this.favorites[index].isShaking = false;
  }

  handleCancel(index: number) {
    this.favorites[index].showActions = false;
    this.favorites[index].isShaking = false;
    this.init();
  }

  handleSave(index: number) {
    this.favorites[index].showActions = false;
    this.favorites[index].isShaking = false;
    // Filters complete copy so that they are not immediately updated in the page, as filters are passed by reference
    const filtersToSave = JSON.parse(JSON.stringify(this.filters));
    this.favorites[index].Content = JSON.stringify(this._removeSkippedFields(filtersToSave));
    this.saveFavorites();
  }

  handleDelete(index: number) {
    this.favorites.splice(index, 1);
    this.saveFavorites();
  }

  handleMoveLeft(index: number) {
    if (index > 0) {
      const temp = this.favorites[index];
      this.favorites[index] = this.favorites[index - 1];
      this.favorites[index - 1] = temp;
    }
  }

  handleMoveRight(index: number) {
    if (index < this.favorites.length - 1) {
      const temp = this.favorites[index];
      this.favorites[index] = this.favorites[index + 1];
      this.favorites[index + 1] = temp;
    }
  }

  handleAddFav() {
    this.favorites.push({ Label: 'New', showActions: true, isShaking: false });
  }

  saveFavorites() {
    
    const value = this.favorites.map(item => {
      return `${item.Content}|${item.Label}`;
    }).join('~');

    const body = {
      value: JSON.parse(JSON.stringify(value))
    };

    this.preferencesService.update(this.settingKey!, this.authService.username, body).pipe(
      tap(e=>{
        this.notificationService.infoMessage("Updated the preference");
        return ""
      }),
      catchError(err => {
        this.notificationService.errorMessage("Failed to update the preference");
        return ""
      })
    ).subscribe();
  }

  
  private _removeSkippedFields(obj: any, replacement: any = undefined) {
    this.skippedFields.forEach(field => {
      try {
        if (replacement && (replacement[field] != undefined)) {
          obj[field] = replacement[field];
        } else {
          delete obj[field];
        }
      } catch (e) {
      }
    });
    return obj;
  }
}
