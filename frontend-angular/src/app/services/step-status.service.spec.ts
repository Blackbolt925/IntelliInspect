import { TestBed } from '@angular/core/testing';

import { StepStatusService } from './step-status.service';

describe('StepStatusService', () => {
  let service: StepStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StepStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
