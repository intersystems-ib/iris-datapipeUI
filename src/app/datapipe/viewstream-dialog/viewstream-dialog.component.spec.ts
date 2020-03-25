import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewstreamDialogComponent } from './viewstream-dialog.component';

describe('ViewstreamDialogComponent', () => {
  let component: ViewstreamDialogComponent;
  let fixture: ComponentFixture<ViewstreamDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewstreamDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewstreamDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
