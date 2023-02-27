import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewstreamDialogComponent } from './viewstream-dialog.component';

describe('ViewstreamDialogComponent', () => {
  let component: ViewstreamDialogComponent;
  let fixture: ComponentFixture<ViewstreamDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewstreamDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewstreamDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
