import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NgxTextDiffModule } from 'ngx-text-diff';

/**
 * View Stream dialog
 */
@Component({
  selector: 'app-viewstream-dialog',
  templateUrl: './viewstream-dialog.component.html',
  styleUrls: ['./viewstream-dialog.component.scss']
})
export class ViewstreamDialogComponent implements OnInit {

  /** title of the dialog */
  title: string;

  /** icon of the dialog */
  icon: string;

  /** stream1  */
  stream1: string;

  /** stream2 */
  stream2: string;

  constructor(
    public dialogRef: MatDialogRef<ViewstreamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  /**
   * Init
   */
  ngOnInit() {
    this.title = this.data.title;
    this.icon = this.data.icon;
    this.stream1 = this.data.stream1;
    this.stream2 = this.data.stream2;
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
