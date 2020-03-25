import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

  /** title of the confirmation dialog */
  title: string;

  /** text of the confirmation dialog */
  text: string;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  /**
   * Init
   */
  ngOnInit() {
    this.title = this.data.title;
    this.text = this.data.text;
  }

  /**
   * Cancel dialog
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Accept dialog
   */
  onAccept(): void {
    this.dialogRef.close(true);
  }

}
