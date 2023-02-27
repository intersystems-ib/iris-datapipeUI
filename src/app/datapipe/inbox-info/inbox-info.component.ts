import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-inbox-info',
  templateUrl: './inbox-info.component.html',
  styleUrls: ['./inbox-info.component.scss']
})
export class InboxInfoComponent implements OnInit {
  
  inboxId?: number;

  constructor(private route: ActivatedRoute,) { }

  ngOnInit() {
    this.inboxId = Number(this.route.snapshot.paramMap.get("inboxId"));
  }

}
