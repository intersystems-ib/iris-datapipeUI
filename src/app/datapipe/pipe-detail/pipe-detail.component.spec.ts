import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PipeDetailComponent } from './pipe-detail.component';

describe('PipeDetailComponent', () => {
  let component: PipeDetailComponent;
  let fixture: ComponentFixture<PipeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PipeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PipeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
