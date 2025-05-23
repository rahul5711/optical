import { TestBed } from '@angular/core/testing';

import { LedgeService } from './ledge.service';

describe('LedgeService', () => {
  let service: LedgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LedgeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
