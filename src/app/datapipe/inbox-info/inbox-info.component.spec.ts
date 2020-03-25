import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxInfoComponent } from './inbox-info.component';

describe('InboxInfoComponent', () => {
  let component: InboxInfoComponent;
  let fixture: ComponentFixture<InboxInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InboxInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InboxInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
