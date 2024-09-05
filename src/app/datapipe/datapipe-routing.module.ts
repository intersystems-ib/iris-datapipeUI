import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InboxInfoComponent } from './inbox-info/inbox-info.component';
import { InboxListComponent } from './inbox-list/inbox-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PipeListComponent } from './pipe-list/pipe-list.component';
import { PipeDetailComponent } from './pipe-detail/pipe-detail.component';
import { AuthGuard } from '../auth/auth.guard';

export const routes: Routes = [
  /* default re-direction: inbox list */
  {
    path: '',
    component: InboxListComponent,
    canActivate: []
  },
  /* dasboard */
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: []
  },
  /* admin: pipe list*/
  {
    path: 'admin/pipe',
    component: PipeListComponent,
    canActivate: []
  },
  /* admin: edit/create pipe */
  {
    path: 'admin/pipe/:pipeCode',
    component: PipeDetailComponent,
    canActivate: []
  },
  /* search: view inbox details */
  {
    path: ':inboxId',
    component: InboxInfoComponent,
    canActivate: []
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DatapipeRoutingModule { }
