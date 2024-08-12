import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PipeListComponent } from './pipe-list.component';

describe('PipeListComponent', () => {
  let component: PipeListComponent;
  let fixture: ComponentFixture<PipeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PipeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PipeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
