import { TestBed } from '@angular/core/testing';

import { DatapipeService } from './datapipe.service';

describe('DatapipeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DatapipeService = TestBed.get(DatapipeService);
    expect(service).toBeTruthy();
  });
});
