import { Injectable } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  public static STANDARD_MESSAGE_DURATION: number = 4000;

  constructor(private messageBar: MatSnackBar) {
  }
  public openMessageBar(message: string, action: string): void {
    this.messageBar.open(message, action, {
      duration: NotificationService.STANDARD_MESSAGE_DURATION,
    });
  }

  public infoMessage(message:string) {
    this.openMessageBar("✅ " + message, "Dismiss")
  }

  public errorMessage(message:string) {
    this.openMessageBar("❌ " + message, "Dismiss")
  }

  public linkCopiedMessage(message:string, typeOfLink : string){
    this.openMessageBar(message+'🌐',  typeOfLink+' Link Copied')
  }

}
