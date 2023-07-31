import { TestBed } from '@angular/core/testing';

import { BillCalculationService } from './bill-calculation.service';

describe('BillCalculationService', () => {
  let service: BillCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillCalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
