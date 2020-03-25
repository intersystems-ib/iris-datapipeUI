import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InboxListComponent } from './inbox-list/inbox-list.component';
import { InboxInfoComponent } from './inbox-info/inbox-info.component';


export const routes: Routes = [
  {
    path: '',
    component: InboxListComponent
  },
  {
    path: ':inboxId',
    component: InboxInfoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DatapipeRoutingModule { }
