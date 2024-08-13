import { Component, Input, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Pipe } from '../datapipe.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DatapipeService } from '../datapipe.service';

@Component({
  selector: 'app-pipe-detail',
  templateUrl: './pipe-detail.component.html',
  styleUrl: './pipe-detail.component.scss'
})
export class PipeDetailComponent {

  /** incoming (url) pipe code */
  @Input()
  pipeCode?: string;

  /** form */
  @ViewChild('pipeForm') scheduleForm!: NgForm;

  /** pipe object */
  pipe?: Pipe;
  pipe$?: Observable<Pipe>;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  /** query params */
  params: any

  /** create / edit mode */
  createMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    public datapipeService: DatapipeService,
    private router: Router,
  ) 
  { }

  /**
   * Init
   */
  ngOnInit() {
    this.loadMasterData();
    this.pipeCode = String(this.route.snapshot.paramMap.get("pipeCode"));
    
    // retrieve query params from url
    this.params = {};
    this.route.queryParamMap.subscribe((p: any) => {
      this.params = p['params'];
    }) 

    if (this.params.create) {
      // creating a new pipe: initialize empty object
      this.createMode = true;
      this.pipe = {
        Code: "",
        Description: "",
        SecurityResource: ""
      }
    }
    else if (this.pipeCode) {
      // editing a pipe: load data
      this.loadData();
    }
  }


  /**
   * Load master data (combos, etc.)
   */
  loadMasterData() {
    ;
  }


  /**
   * Load data from server using service
   */
  loadData() {
    this.loading$.next(true);

    if (this.pipeCode) {
      // get schedule details
      this.datapipeService.findPipeByCode(this.pipeCode).subscribe(pipe => {
          this.pipe = pipe;
      });
      
      this.loading$.next(false);
    }
  }

  /** 
   * Go back 
   */
  goBack(): void {
    this.router.navigate([`/datapipe/admin/pipe`]);
  }

  /**
   * Save pipe
   */
  save(): void {
    if (this.pipe) {
      if (this.createMode) {
        // create
        this.datapipeService.createPipe(this.pipe).subscribe(res => {
          this.goBack();
        });
      }
      else if (this.pipeCode) {
        // update
        this.datapipeService.updatePipe(this.pipeCode, this.pipe).subscribe(res => {
          this.loadData();
          this.goBack();
        });
      }
    }

  }
}
