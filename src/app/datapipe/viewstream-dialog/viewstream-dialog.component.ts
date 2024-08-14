import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-viewstream-dialog',
  templateUrl: './viewstream-dialog.component.html',
  styleUrls: ['./viewstream-dialog.component.scss']
})
export class ViewstreamDialogComponent implements OnInit {

  /** title of the dialog */
  title?: string;

  /** subtitle of the dialog */
  subtitle?: string;

  /** icon of the dialog */
  icon?: string;

  /** edit mode */
  editMode: boolean = false;

  /** stream1  */
  stream1: string = '';

  /** initial number of lines of stream1 */
  stream1Lines: number = 0;

  /** stream2 */
  stream2: string = '';

  constructor(
    public dialogRef: MatDialogRef<ViewstreamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  /**
   * Init
   */
  ngOnInit() {
    this.title = this.data.title;
    this.subtitle = this.data.subtitle;
    this.icon = this.data.icon;
    this.editMode = this.data.editMode;
    this.stream1 = this.data.stream1;
    this.stream2 = this.data.stream2;

    this.stream1Lines = this.stream1.split(/\r\n|\r|\n/).length
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

  /**
   * Save
   */
  onSave(): void {
    this.dialogRef.close(this.stream1);
  }

}
