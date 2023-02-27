import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxHistoryComponent } from './inbox-history.component';

describe('InboxHistoryComponent', () => {
  let component: InboxHistoryComponent;
  let fixture: ComponentFixture<InboxHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InboxHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InboxHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
