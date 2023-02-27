import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InboxInfoComponent } from './inbox-info/inbox-info.component';
import { InboxListComponent } from './inbox-list/inbox-list.component';

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
