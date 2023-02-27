import { Component, OnInit, Input } from '@angular/core';
import { DatapipeService } from '../datapipe.service';
import { ActivatedRoute } from '@angular/router';
import { Inbox, Ingestion, Staging, Oper } from '../datapipe.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Component({
  selector: 'app-inbox-history',
  templateUrl: './inbox-history.component.html',
  styleUrls: ['./inbox-history.component.scss']
})
export class InboxHistoryComponent implements OnInit {

  @Input()
  inboxId?: number;

  inbox$?: Observable<Inbox>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    public datapipeService: DatapipeService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    if (!this.inboxId) {
      this.inboxId = Number(this.route.snapshot.paramMap.get("inboxId"));
    }
    this.loadData();
  }

  /**
   * Load inbox history (ingestions > stagings > operations).
   * This method does not retrive stream data
   */
  loadData() {
      this.loading$.next(true);
      
      this.inboxId = Number(this.inboxId);
      this.inbox$ = this.datapipeService.findInboxById(this.inboxId).pipe(
      map(inbox => {

        // retrieve ingestions
        this.inboxId = Number(this.inboxId);
        inbox.Ingestions$ = this.datapipeService.findIngestionsByInbox(this.inboxId).pipe(
          map(queryResult => {
            let ingestions: Ingestion[] = queryResult['children'];
            
            // retrieve stagings
            for (let ingestion of ingestions) {
              ingestion.Stagings$ = this.datapipeService.findStagingsByIngestion(ingestion.Id).pipe(
                map(queryResult => {
                  let stagings: Staging[] = queryResult['children'];
                  
                  // retrieve operations
                  for (let staging of stagings) {
                    staging.Opers$ = this.datapipeService.findOpersByStaging(staging.Id).pipe(
                      map(queryResult => {
                        let opers: Oper[] = queryResult['children'];
                        return opers;
                      })
                    )
                  }
                  return stagings;
                })
              );
            }
            return ingestions;
          })
        )
        return inbox;
      })
    );
    this.loading$.next(false);
  }

  /**
   * Click on Ingestion Stream (Model Data). Download data and display it.
   * @param id 
   */
  clickIngestionStream(id: number) {
    this.datapipeService.findIngestionById(id).subscribe(
      ingestion => {
        this.datapipeService.clickViewStream({
          title: 'Model Data', 
          icon: 'code',
          stream1: ingestion.ModelData
        })
      }
    )
  }

  /**
   * Click on Staging Stream (Model Norm Data). Download data and display it.
   * @param id 
   */
  clickStagingStream(id: number) {
    this.datapipeService.findStagingById(id).subscribe(
      staging => {
        this.datapipeService.clickViewStream({
          title: 'Model Normalized Data', 
          icon: 'code',
          stream1: staging.ModelNormData
        })
      }
    )
  }

  /**
   * Click on Operation Log Stream. Download data and display it.
   * @param id 
   */
  clickOperationLogStream(id: number) {
    this.datapipeService.findOperById(id).subscribe(
      oper => {
        this.datapipeService.clickViewStream({
          title: 'Operation Log', 
          icon: 'description',
          stream1: oper.OperLog
        })
      }
    )
  }

}
