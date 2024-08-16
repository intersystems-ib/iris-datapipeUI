import { Component, OnInit, Input } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Inbox, Ingestion, Staging, Oper } from '../datapipe.model';
import { DatapipeService } from '../datapipe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { NotificationService } from 'src/app/shared/notification.service';


@Component({
  selector: 'app-inbox-detail',
  templateUrl: './inbox-detail.component.html',
  styleUrls: ['./inbox-detail.component.scss'],
})
export class InboxDetailComponent implements OnInit {

  @Input()
  inboxId?: number;

  inbox$?: Observable<Inbox>;
  ingestion$?: Observable<Ingestion>;
  staging$?: Observable<Staging>;
  oper$?: Observable<Oper>;

  loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  inbox?: Inbox;

  constructor(
    public datapipeService: DatapipeService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    if (!this.inboxId) {
      this.inboxId = Number(this.route.snapshot.paramMap.get("inboxId"));
    }
    this.loadData();
  }

  /**
   * Load data from server using service
   */
  loadData() {
    this.loading$.next(true);
    if (this.inboxId) {
      this.inbox$ = this.datapipeService.findInboxById(this.inboxId).pipe(
        tap(inbox => { 
          this.inbox = inbox;
          this.ingestion$ = this.datapipeService.findIngestionById(inbox.LastIngestion).pipe();
          if (inbox.LastStaging) {
            this.staging$ = this.datapipeService.findStagingById(inbox.LastStaging).pipe();
          }
          if (inbox.LastOper) {
            this.oper$ = this.datapipeService.findOperById(inbox.LastOper).pipe();
          }
          
        })
      );
    this.loading$.next(false);
    }
  }

  
  /**
   * Repeat ingestion|staging|operation in selected rows
   * @param type ingestion|staging|operation
   * @param inboxId
   */
  repeatInbox(type: string, inbox: Inbox) {

    let confirmationMsg = `Repeat ${type}?`;
    if (inbox.Status === "DONE" && inbox.StagingStatus==="VALID" && inbox.OperStatus==="PROCESSED") {
      confirmationMsg = '⚠️ Warning! This record was already processed successfully\n\n' + confirmationMsg
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Confirmation', text: confirmationMsg }
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        let ids = [];
        ids.push(inbox.Id)
        
        this.datapipeService.repeatInbox(type, ids).subscribe(
          data => {
            this.loading$.next(true);
            setTimeout(() => {
              this.loadData();
              this.loading$.next(false);
            }, 2000);
          }
        )
      }
    });
  }

  /**
   * Returns true if resend buttons must be disabled.
   * Resend buttons are disabled when a message has been processed with no errors
   */
  repeatDisabled() {
    return (
      !this.inbox ||
      !this.authService.checkPermission("DP_ADMIN", "U") /*||
      (this.inbox.Status==="DONE" &&
      this.inbox.StagingStatus==="VALID" &&
      this.inbox.OperStatus==="PROCESSED")*/
    );
  }

  /** 
   * Go back 
   */
  goBack(): void {
    this.router.navigate([`/datapipe`]);
  }

  /** 
   * Click on editing (manually) normalized data
   * @param operHeaderId operation header id message
   * @param normData original normalized data
   */
  clickEditNormData(operHeaderId: number, normData: string) {

    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: '⚠️ Warning!', text: 'Do you want to manually overwrite Normalized data and repeat operation?' }
    });

    confirmDialog.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        const dialogRef = this.datapipeService.clickViewStream({
          title: 'Edit Normalized Data & Repeat Operation',
          subtitle: '⚠️ This will manually overwrite Normalized data and repeat operation with the overridden data', 
          icon: 'edit',
          editMode: true, 
          stream1: normData}
        );
    
        dialogRef.afterClosed().subscribe(editedData => {
          if (editedData) {
            this.datapipeService.updateOperRequest(operHeaderId, editedData).subscribe(data => {
              this.loading$.next(true);
              setTimeout(() => {
                this.loadData();
                this.loading$.next(false);
              }, 2000);
            });
          }
        });
      }
    });

    
  }

}
