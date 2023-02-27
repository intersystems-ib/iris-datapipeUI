import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxDetailComponent } from './inbox-detail.component';

describe('InboxDetailComponent', () => {
  let component: InboxDetailComponent;
  let fixture: ComponentFixture<InboxDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InboxDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InboxDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
