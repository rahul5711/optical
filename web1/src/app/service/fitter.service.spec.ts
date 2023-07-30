import { TestBed } from '@angular/core/testing';

import { FitterService } from './fitter.service';

describe('FitterService', () => {
  let service: FitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FitterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
