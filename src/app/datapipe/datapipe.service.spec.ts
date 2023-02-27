import { TestBed } from '@angular/core/testing';

import { DatapipeService } from './datapipe.service';

describe('DatapipeService', () => {
  let service: DatapipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatapipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
