import { Component, OnInit, Input } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Inbox, Ingestion, Staging, Oper } from '../datapipe.model';
import { DatapipeService } from '../datapipe.service';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-inbox-detail',
  templateUrl: './inbox-detail.component.html',
  styleUrls: ['./inbox-detail.component.scss']
})
export class InboxDetailComponent implements OnInit {

  @Input()
  inboxId: number;

  inbox$: Observable<Inbox>;
  ingestion$: Observable<Ingestion>;
  staging$: Observable<Staging>;
  oper$: Observable<Oper>;

  loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private datapipeService: DatapipeService,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    if (!this.inboxId) {
      this.inboxId = +this.route.snapshot.paramMap.get("inboxId");
    }
    this.loadData();
  }

  /**
   * Load data from server using service
   */
  loadData() {
    this.loading$.next(true);
    this.inbox$ = this.datapipeService.findInboxById(this.inboxId).pipe(
      tap(inbox => { 
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

  /**
   * Resend a message
   * This method is used to repeat Ingestion, Staging or Operation layers
   * @param msgId
   */
  clickResendMessage(msgId: number, text: string) {

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Confirmation', text: text }
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.datapipeService.resendMessage(msgId).subscribe(
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
  
}
