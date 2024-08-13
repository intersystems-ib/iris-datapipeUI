import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultFiltersComponent } from './default-filters.component';

describe('DefaultFiltersComponent', () => {
  let component: DefaultFiltersComponent;
  let fixture: ComponentFixture<DefaultFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefaultFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
